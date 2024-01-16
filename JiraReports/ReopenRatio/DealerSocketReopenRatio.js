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

let JIRA_URL = process.env.JIRA_URL_DS;
let API_TOKEN = process.env.API_TOKEN_DS;
let EMAIL = process.env.EMAIL_DS;
let jiraInstance = "DealerSocket";
let projectIDS = [
  "CRMCOR",
  "AMACC",
  "AMECON",
  "AMFOPS",
  "AMDES",
  "AMOM",
  "AMAM",
  "AMRL",
  "AMBLOB",
  "AMAS",
  "AMCRM",
  "AMFFP",
  "AMFS",
  "AMINF",
  "AMLEG",
  "AMLTG",
  "AMMAINT",
  "AMNS",
  "AMOEMCM",
  "AMPARL",
  "AMPAY",
  "AMPOBOX",
  "AMQAA",
  "AMMATE",
  "AMSKIR",
  "AMSU",
  "AMUPD",
  "AMUT",
  "AMVM",
  "AMVIN",
  "DFWEB",
  "INVADMIN",
  "INVECL",
  "INVMANAGER",
  "INVUI",
  "INVINTERN",
  "IDMS",
];
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
    let restOfJQL = "";
    let moreJQL = "";
    let issueTypes = `Bug, Defect,"Story Bug"`;
    let reopenworkFlowStatuses = [
      /-In Testing to In Progress-/g,
      /-In Acceptance to In Progress-/g,
      /-Resolved to In Progress-/g,
      /-Closed to Open-/g,
    ];
    let fixedWorkFlowStatuses = [
      /-In Progress to In Acceptance-/g,
      /-In Progress to Ready for Testing-/g,
    ];
    let storyBugsFixedWorkFlowStatuses = [/-In Progress to Resolved-/g];
    let storyBugsReopenWorkFlowStatuses = [
      /-Resolved to In Progress-/g,
      /-Resolved to To Do-/g,
    ];
    let failedStatus = [];
    let allIssues = [];
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
    
      // esta variable contiene los issues que tienen menos de 100 en el historial de cambios
      let allFixedAndReopenByUSER = [];
      allIssues.forEach((issue) => {
        let statuses = "";
        let lastDateHistorie;
        if (issue.changelog.histories.length === 100) {
          issuesWithMoreTan100Histories.push({
            key: issue.key,
            project: issue.fields.project.name,
            issueType: issue.fields.issuetype.name,
            developer: designedDeveloperObtained(issue.fields),
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
                }
              } else {
                statuses += "";
              }
            });
          });
          let finalReopenCount = 0;
          let finalFixedCount = 0;
          if (jiraInstance === "DealerSocket") {
            if (issue.fields.issuetype.name !== "Story Bug") {
              for (
                let index = 0;
                index < reopenworkFlowStatuses.length;
                index++
              ) {
                let countByStatus =
                  statuses.match(reopenworkFlowStatuses[index]) || [];
                finalReopenCount += countByStatus.length;
              }
              for (let index = 0; index < fixedWorkFlowStatuses.length; index++) {
                let countByStatus =
                  statuses.match(fixedWorkFlowStatuses[index]) || [];
                finalFixedCount += countByStatus.length;
              }
            }
            if (issue.fields.issuetype.name === "Story Bug") {
              for (
                let index = 0;
                index < storyBugsReopenWorkFlowStatuses.length;
                index++
              ) {
                let countByStatus =
                  statuses.match(storyBugsReopenWorkFlowStatuses[index]) || [];
                finalReopenCount += countByStatus.length;
              }
              for (
                let index = 0;
                index < storyBugsFixedWorkFlowStatuses.length;
                index++
              ) {
                let countByStatus =
                  statuses.match(storyBugsFixedWorkFlowStatuses[index]) || [];
                finalFixedCount += countByStatus.length;
              }
            }
          }
          allFixedAndReopenByUSER.push({
            project: issue.fields.project.name,
            developer: designedDeveloperObtained(issue.fields),
            key: issue.key,
            issueType: issue.fields.issuetype.name,
            reopenIssues: finalReopenCount > 0 ? 1 : 0,
            fixedIssues: finalFixedCount > 0 ? 1 : 1,
            year: new Date(lastDateHistorie).getFullYear(),
            month: monthNames[new Date(lastDateHistorie).getMonth()], // March
            updated: dateFormatting(lastDateHistorie),
          });
        }
      });

        // esta variable contiene los issues que tienen mas de 100 en el historial de cambios con su key su proyecto y su lista de resultados
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
      finalListWithMoreTan100Histories.push({
        key: issuesWithMoreTan100Histories[index].key,
        issueType: issuesWithMoreTan100Histories[index].issueType,
        developer: issuesWithMoreTan100Histories[index].developer,
        project: issuesWithMoreTan100Histories[index].project,
        histories: allHistories,
      });
    
  }
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
            } else {
              if (
                item.toString === "Resolved" ||
                item.toString === "Closed" ||
                item.toString === "Done"
              ) {
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
      if (jiraInstance === "DealerSocket") {
        if (issue.issueType !== "Story Bug") {
          for (let index = 0; index < reopenworkFlowStatuses.length; index++) {
            let countByStatus =
              statuses.match(reopenworkFlowStatuses[index]) || [];
            finalReopenCount += countByStatus.length;
          }
          for (let index = 0; index < fixedWorkFlowStatuses.length; index++) {
            let countByStatus =
              statuses.match(fixedWorkFlowStatuses[index]) || [];
            finalFixedCount += countByStatus.length;
          }
        }
        if (issue.issueType === "Story Bug") {
          for (
            let index = 0;
            index < storyBugsReopenWorkFlowStatuses.length;
            index++
          ) {
            let countByStatus =
              statuses.match(storyBugsReopenWorkFlowStatuses[index]) || [];
            finalReopenCount += countByStatus.length;
          }
          for (
            let index = 0;
            index < storyBugsFixedWorkFlowStatuses.length;
            index++
          ) {
            let countByStatus =
              statuses.match(storyBugsFixedWorkFlowStatuses[index]) || [];
            finalFixedCount += countByStatus.length;
          }
        }
      }
       missingIssuesInfo.push({
          project: issue.project,
          developer: issue.developer,
          key: issue.key,
          issueType: issue.issueType,
          reopenIssues: finalReopenCount > 0 ? 1 : 0,
          fixedIssues: finalFixedCount > 0 ? 1 : 1,
          // realFixed: finalFixedCount,
          year: new Date(lastDateHistorie).getFullYear(),
          month: monthNames[new Date(lastDateHistorie).getMonth()],
          updated: dateFormatting(lastDateHistorie),
        });
      
    });
  }
  let finalReport = [...allFixedAndReopenByUSER, ...missingIssuesInfo];
  console.log("Total de issues COMPLETOS: " + finalReport.length);
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


}

fetchData();