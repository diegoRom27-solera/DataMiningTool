const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");
const excelFilePath = "../FleetReopen.xlsx";

require("dotenv").config();
const {
  designedDeveloperObtained,
  isBugDefOpen,
  isIndependentTasks,
  priorityFormatting,
  dateFormatting,
} = require("../../Utils/UtilsOnCloud");

let JIRA_URL = process.env.JIRA_URL_FLEET;
let API_TOKEN = process.env.API_TOKEN_FLEET;
let EMAIL = process.env.EMAIL_FLEET;
let jiraInstance = "Fleet";
let projectIDS = ["XRS", "PF", "RPE", "DCMD", "DVIR", "MA3PI", "OHOS", "TM"];
let startDate = process.env.START_DATE;
let allIssues = [];
let issuesWithMoreTan100Histories = [];
let endDate = process.env.END_DATE;
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const fetchData = async () => {
  let issueTypes = "Bug, Defect";
  let fixedWorkFlowStatuses = [
    /-Ready for Build to Ready for Testing-/g,
    /-In Progress to Ready for Testing-/g,
    /-Ready for Engineering to In Acceptance-/g,
    /-In Progress to In Acceptance-/g,
    /-Open to In Acceptance-/g,
  ];
  let reopenworkFlowStatuses = [
    /-In Testing to In Progress-/g,
    /-In Testing to Ready for Engineering-/g,
    /-In Acceptance to Ready for Engineering-/g,
  ];
  let moreJQL = `AND resolution in (Done) AND ("Root Cause[Dropdown]" not in ("Cannot Reproduce","Duplicate","Works As Designed","Won't Do") OR "Root Cause[Dropdown]" is EMPTY)`;
  let restOfJQL = ` OR status changed from "Ready for Build" to "Ready for Testing" DURING ('${startDate} 00:00', '${endDate} 23:59') OR status changed from "In Progress" to "Ready for Testing" during ('${startDate} 00:00', '${endDate} 23:59') OR status changed from "Ready for Engineering" to "In Acceptance" during ('${startDate} 00:00', '${endDate} 23:59') OR status changed from "In Progress" to "In Acceptance" during ('${startDate} 00:00', '${endDate} 23:59') OR status changed from "Open" to "In Acceptance" during ('${startDate} 00:00', '${endDate} 23:59')`;
  for (let index = 0; index < projectIDS.length; index++) {
    const maxResults = 100;
    let startAt = 0;
    let total = 0;
    do {
      try {
        console.log(
          `${JIRA_URL}/search?jql=project="${projectIDS[index]}" AND issuetype in (${issueTypes}) ${moreJQL} AND (status changed To "Resolved" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Closed" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Done" DURING ('${startDate} 00:00', '${endDate} 23:59')${restOfJQL})&expand=changelog&startAt=${startAt}&maxResults=${maxResults}`
        );
        const response = await axios.get(
          `${JIRA_URL}/search?jql=project="${projectIDS[index]}" AND issuetype in (${issueTypes}) ${moreJQL} AND (status changed To "Resolved" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Closed" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Done" DURING ('${startDate} 00:00', '${endDate} 23:59')${restOfJQL})&expand=changelog&startAt=${startAt}&maxResults=${maxResults}`,
          {
            headers: {
              "Access-Control-Allow-Origin": "*", // Required for CORS support to work
              Authorization: `Basic ${btoa(`${EMAIL}:${API_TOKEN}`)}`,
              Accept: "application/json",
            },
          }
        );
        if (response.status === 200) {
          total = response.data.total;
          console.log("Respuesta total: " + total + " startAt: " + startAt);
          startAt += maxResults;
          let issues = response.data.issues;
          allIssues = [...allIssues, ...issues];
          console.log(allIssues.length);
        }
      } catch (error) {
        failedStatus.push({
          type: "Request Error",
          data: {
            project: projectIDS[index],
          },
        });
      }
    } while (startAt < total);
  }
  let allFixedAndReopenByUSER = [];
  allIssues.forEach((issue) => {
    let statuses = "";
    let lastDateHistorie;
    // guardamos los que sean mas pesados
    if (issue.changelog.histories.length === 100) {
      issuesWithMoreTan100Histories.push({
        key: issue.key,
        developer:
          issue.fields.customfield_10077 !== null
            ? typeof issue.fields.customfield_10077.displayName === "string"
              ? issue.fields.customfield_10077.displayName
              : ""
            : "",
        issueType: issue.fields.issuetype.name,
        project: issue.fields.project.name,
        teamName:
          issue.fields.customfield_10052 !== null
            ? typeof issue.fields.customfield_10052.value === "string"
              ? issue.fields.customfield_10052.value
              : ""
            : "",
        issueType: issue.fields.issuetype.name,
      });
    } else {
      issue.changelog.histories.reverse().forEach((history) => {
        history.items.forEach((item) => {
          if (item.field === "status") {
            statuses += `-${item.fromString} to ${item.toString}-`;
            if (
              item.toString === "Resolved" ||
              item.toString === "Closed" ||
              item.toString === "Done"
            ) {
              lastDateHistorie = history.created;
            } else {
              lastDateHistorie = history.created;
            }
          } else {
            statuses += "";
          }
        });
      });
      let finalReopenCount = 0;
      let finalFixedCount = 0;
      let statusReopen = "";
      let statusFixed = "";
      if (jiraInstance === "Fleet") {
        for (let index = 0; index < reopenworkFlowStatuses.length; index++) {
          let countByStatus =
            statuses.match(reopenworkFlowStatuses[index]) || [];
          if (countByStatus.length > 0) {
            statusReopen = `${reopenworkFlowStatuses[index]}`;
          }
          finalReopenCount += countByStatus.length;
        }
        for (let index = 0; index < fixedWorkFlowStatuses.length; index++) {
          let countByStatus =
            statuses.match(fixedWorkFlowStatuses[index]) || [];
          if (countByStatus.length > 0) {
            statusFixed = `${fixedWorkFlowStatuses[index]}`;
          }
          finalFixedCount += countByStatus.length;
        }
      }
      if (finalFixedCount !== 0) {
        allFixedAndReopenByUSER.push({
          project: issue.fields.project.name,
          developer:
            issue.fields.customfield_10077 !== null
              ? typeof issue.fields.customfield_10077.displayName === "string"
                ? issue.fields.customfield_10077.displayName
                : ""
              : "",
          key: issue.key,
          issueType: issue.fields.issuetype.name,
        //   statusReopen: statusReopen,
        //   statusFixed: statusFixed,
          reopenIssues: finalReopenCount > 0 ? 1 : 0,
          fixedIssues: finalFixedCount > 0 ? 1 : 1,
        //   realFixed: finalFixedCount,
          year: new Date(lastDateHistorie).getFullYear(),
          month: monthNames[new Date(lastDateHistorie).getMonth()], // March
          // day: new Date(lastDateHistorie).getDate(),
          // dayName: new Date(lastDateHistorie).getDay(),
          updated: dateFormatting(lastDateHistorie),
          // teamName:
          //   issue.fields.customfield_10052 !== null
          //     ? typeof issue.fields.customfield_10052.value === "string"
          //       ? issue.fields.customfield_10052.value
          //       : ""
          //     : "",
          // issueType: issue.fields.issuetype.name,
        //   statuses: statuses,
        });
      }
    }
  });


  let finalListWithMoreTan100Histories = [];
  console.log(
    "******************************* apartir de aqui empiezan los pesados *******************************"
  );
  console.log(issuesWithMoreTan100Histories.length);
  // Obtener el historial de aquellos que tengan mas de 100 historias
  for (let index = 0; index < issuesWithMoreTan100Histories.length; index++) {
    const maxResultsC = 100;
    let startAtC = 0;
    let totalC = 0;
    let allHistories = [];
    do {
      try {
        console.log(issuesWithMoreTan100Histories[index].key);
        const response = await axios.get(
          `${JIRA_URL}/issue/${issuesWithMoreTan100Histories[index].key}/changelog?startAt=${startAtC}&maxResults=${maxResultsC}`,
          {
            headers: {
              "Access-Control-Allow-Origin": "*", // Required for CORS support to work
              Authorization: `Basic ${btoa(`${EMAIL}:${API_TOKEN}`)}`,
              Accept: "application/json",
            },
          }
        );
        if (response.status === 200) {
          totalC = response.data.total;
          console.log("Respuesta total: " + totalC + " startAt: " + startAtC);
          startAtC += maxResultsC;
          let histories = response.data.values;
          allHistories = [...allHistories, ...histories];
        }
      } catch (error) {
        failedStatus.push({
          type: "Request Issue Error",
          data: {
            issues: issuesWithMoreTan100Histories[index],
          },
        });
      }
    } while (startAtC < totalC);
    // formamos el objeto con el historial de cambios
    if (jiraInstance !== "DealerSocket") {
      finalListWithMoreTan100Histories.push({
        key: issuesWithMoreTan100Histories[index].key,
        issueType: issuesWithMoreTan100Histories[index].issueType,
        developer: issuesWithMoreTan100Histories[index].developer,
        project: issuesWithMoreTan100Histories[index].project,
        // teamName: issuesWithMoreTan100Histories[index].teamName,
        // issueType: issuesWithMoreTan100Histories[index].issueType,
        histories: allHistories,
      });
    }
    
  }

    // esta variable contiene los issues que faltna por agregar y que estaban contenidos en los que tenian mas de 100 con sus conteos respectivos
    let missingIssuesInfo = [];

    if (finalListWithMoreTan100Histories.length > 0) {
      finalListWithMoreTan100Histories.forEach((issue) => {
        let statuses = "";
        let lastDateHistorie;
        issue.histories.forEach((history) => {
          history.items.forEach((item) => {
            if (item.field === "status") {
              statuses += `-${item.fromString} to ${item.toString}-`;
              if (jiraInstance !== "DealerSocket") {
                if (
                  item.toString === "Resolved" ||
                  item.toString === "Closed" ||
                  item.toString === "Done"
                ) {
                  lastDateHistorie = history.created;
                } else {
                  lastDateHistorie = history.created;
                }
              }
            } else {
              statuses += "";
            }
          });
        });
        let finalReopenCount = 0;
        let finalFixedCount = 0;
        let statusReopen = "";
        let statusFixed = "";
        if (jiraInstance === "Fleet") {
          for (let index = 0; index < reopenworkFlowStatuses.length; index++) {
            let countByStatus =
              statuses.match(reopenworkFlowStatuses[index]) || [];
            if (countByStatus.length > 0) {
              statusReopen = `${reopenworkFlowStatuses[index]}`;
            }
            finalReopenCount += countByStatus.length;
          }
          for (let index = 0; index < fixedWorkFlowStatuses.length; index++) {
            let countByStatus =
              statuses.match(fixedWorkFlowStatuses[index]) || [];
            if (countByStatus.length > 0) {
              statusFixed = `${fixedWorkFlowStatuses[index]}`;
            }
            finalFixedCount += countByStatus.length;
          }
        }
        if (jiraInstance !== "DealerSocket") {
          if (finalFixedCount !== 0) {
            missingIssuesInfo.push({
              project: issue.project,
              developer: issue.developer,
              key: issue.key,
              issueType: issue.issueType,
            //   statusReopen: statusReopen,
            //   statusFixed: statusFixed,
              reopenIssues: finalReopenCount > 0 ? 1 : 0,
              fixedIssues: finalFixedCount > 0 ? 1 : 1,
            //   realFixed: finalFixedCount,
              year: new Date(lastDateHistorie).getFullYear(),
              month: monthNames[new Date(lastDateHistorie).getMonth()],
              // day: new Date(lastDateHistorie).getDate(),
              // dayName: new Date(lastDateHistorie).getDay(),
              updated: dateFormatting(lastDateHistorie),
              // teamName: issue.teamName,
            //   statuses: statuses,
            });
          }
        }
      });
    }
  
    let finalReport = [...allFixedAndReopenByUSER, ...missingIssuesInfo];

    console.log('finalReport', finalReport.length);

    if (fs.existsSync(excelFilePath)) {
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0]; // Suponemos que el archivo Excel tiene una sola hoja
        const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const combinedData = [...existingData, ...finalReport];
        const newWorkbook = XLSX.utils.book_new();
        const newSheet = XLSX.utils.json_to_sheet(combinedData);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
        XLSX.writeFile(newWorkbook, excelFilePath);
      }
  
};

fetchData();