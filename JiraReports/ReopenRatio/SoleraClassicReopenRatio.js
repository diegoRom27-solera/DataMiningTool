const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");
require("dotenv").config();
const {
  isBugDefOpen,
  designedDeveloperObtained,
  designedTesterIsObtained,
  StoryPointsObtained,
  priorityFormatting,
  dateFormatting,
} = require("../../Utils/UtilsOnPrem");

const excelFilePath = "../FleetReopen.xlsx";
const JIRA_URL = process.env.JIRA_URL_OP;
const username = process.env.EMAIL_OP;
const password = process.env.PASSWORD_OP;
let jiraInstance = "SoleraClassic";
let projectIDS = [
  "NCMP",
  "VIN",
  "AC",
  "GTR",
  "A2E",
  "HQCL",
  "GTA",
  "AWTC",
  "ADXEA",
  "FEES",
  "GLXS",
  "GTI",
  "B2BS",
  "GPMB",
  "LA",
  "LWF",
  "LI",
  "MSOP",
  "NMV",
  "ONMA",
  "NCMR",
  "ADXE10",
  "QHD",
  "RIG",
  "TLWT",
  "RR",
  "OC",
  "DHW",
  "DRSP",
  "DSPE",
  "IMF",
  "FMP",
  "TPRS",
  "HCC",
  "DS",
  "HPL3X",
  "HPM3",
  "HPDC",
  "IATN",
  "IAT2",
  "PN",
  "EGII",
  "EFCR",
  "EFGW",
  "MS",
  "LINT",
  "MP2",
  "RRP",
  "TB",
  "EM",
  "EFL",
  "GM",
  "MD",
  "TMT",
  "NAT",
  "TSC",
  "INF",
  "VM",
  "WLPT",
  "EN",
  "EIF",
  "EIP",
  "EIRS",
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
let session = {};
const loginUrl = `${JIRA_URL}/auth/1/session`;
const loginData = {
  username: username,
  password: password,
};
const fetchData = async () => {
  let issueTypes = `Bug, Defect,"Story Bug"`;
  let reopenworkFlowStatuses = [
    /-Resolved to In Progress-/g,
    /-In Testing to In Progress-/g,
    /-In Acceptance to In Progress-/g,
    /-Ready for Testing to In Progress-/g,
  ];
  let fixedWorkFlowStatuses = [
    /-In Progress to Resolved-/g,
    /-In Progress to In Acceptance-/g,
    /-In Progress to Ready for Testing-/g,
  ];
  let storyBugsFixedWorkFlowStatuses = [/-In Progress to Done-/g];
  let storyBugsReopenWorkFlowStatuses = [/-Done to In Progress-/g];

  let failedStatus = [];
  let allFixedAndReopenByUSER = [];
  try {
    const loginResponse = await axios.post(loginUrl, loginData);
    if (loginResponse.data && loginResponse.data.session) {
      session.cookie = loginResponse.data.session.value;

      for (let index = 0; index < projectIDS.length; index++) {
        const maxResults = 100;
        let startAt = 0;
        let total = 0;
        console.log("Proyecto: " + projectIDS[index]);
        console.log(
          `${JIRA_URL}/api/2/search?jql=project="${projectIDS[index]}" AND issuetype in (${issueTypes}) AND (status changed To "Resolved" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Closed" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Done" DURING ('${startDate} 00:00', '${endDate} 23:59'))&expand=changelog&startAt=${startAt}&maxResults=${maxResults}`
        );
        do {
          try {
            const response = await axios.get(
              `${JIRA_URL}/api/2/search?jql=project="${projectIDS[index]}" AND issuetype in (${issueTypes}) AND (status changed To "Resolved" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Closed" DURING ('${startDate} 00:00', '${endDate} 23:59') OR  status changed To "Done" DURING ('${startDate} 00:00', '${endDate} 23:59'))&expand=changelog&startAt=${startAt}&maxResults=${maxResults}`,
              {
                headers: {
                  "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                  Accept: "application/json",
                  Cookie: `JSESSIONID=${session.cookie}`,
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
    } else {
      throw new Error("Login Failed");
    }
  } catch (loginError) {
    throw loginError;
  }

  console.log("Total de issues: " + allIssues.length);
  // esta variable contiene los issues que tienen menos de 100 en el historial de cambios
  if (jiraInstance === "SoleraClassic") {
    allIssues.forEach((issue) => {
      let statuses = "";
      let lastDateHistorie;
      if (issue.changelog.histories.length === 100) {
        issuesWithMoreTan100Histories.push({
          key: issue.key,
          project: issue.fields.project.name,
          issueType: issue.fields.issuetype.name,
          developer: designedDeveloperObtained(issue.fields, jiraInstance),
        });
      } else {
        issue.changelog.histories.forEach((history) => {
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
        if (jiraInstance === "SoleraClassic") {
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
          developer: designedDeveloperObtained(issue.fields, jiraInstance),
          key: issue.key,
          issueType: issue.fields.issuetype.name,
          reopenIssues: finalReopenCount > 0 ? 1 : 0,
          fixedIssues: finalFixedCount > 0 ? 1 : 1,
          year: new Date(lastDateHistorie).getFullYear(),
          month: monthNames[new Date(lastDateHistorie).getMonth()],
          updated: dateFormatting(lastDateHistorie),
        });
      }
    });
  }
  console.log("Total de issues COMPLETOS: " + allFixedAndReopenByUSER.length);
  let finalListWithMoreTan100Histories = [];
  console.log(
    "******************************* apartir de aqui empiezan los pesados *******************************"
  );
  let SecondSession = {};
  console.log(issuesWithMoreTan100Histories.length);
  try {
    const loginResponse = await axios.post(loginUrl, loginData);
    if (loginResponse.data && loginResponse.data.session) {
      SecondSession.cookie = loginResponse.data.session.value;
    }
    // Obtener el historial de aquellos que tengan mas de 100 historias
    for (let index = 0; index < issuesWithMoreTan100Histories.length; index++) {
      const maxResultsC = 100;
      let startAtC = 0;
      let totalC = 0;
      let allHistories = [];
      do {
        try {
          console.log(
            `${JIRA_URL}/api/2/issue/${issuesWithMoreTan100Histories[index].key}/changelog?startAt=${startAtC}&maxResults=${maxResultsC}`
          );
          const response = await axios.get(
            `${JIRA_URL}/api/2/issue/${issuesWithMoreTan100Histories[index].key}/changelog?startAt=${startAtC}&maxResults=${maxResultsC}`,
            {
              headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                Accept: "application/json",
                Cookie: `JSESSIONID=${SecondSession.cookie}`,
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
      finalListWithMoreTan100Histories.push({
        key: issuesWithMoreTan100Histories[index].key,
        issueType: issuesWithMoreTan100Histories[index].issueType,
        developer: issuesWithMoreTan100Histories[index].developer,
        project: issuesWithMoreTan100Histories[index].project,
        histories: allHistories,
      });
    }
  } catch (error) {
    console.log(error);
  }

   // esta variable contiene los issues que faltna por agregar y que estaban contenidos en los que tenian mas de 100 con sus conteos respectivos
   let missingIssuesInfo = [];

   if (finalListWithMoreTan100Histories.length > 0) {
     finalListWithMoreTan100Histories.forEach((issue) => {
       let statuses = "";
       let lastDateHistorie;
       // guardamos los pesados
       let fixedCount = 0;
       issue.histories.forEach((history) => {
         history.items.forEach((item) => {
           if (
             item.toString === "Resolved" ||
             item.toString === "Closed" ||
             item.toString === "Done"
           ) {
             lastDateHistorie = history.created;
           }
           if (item.field === "status") {
             statuses += `-${item.fromString} to ${item.toString}-`;
           } else {
             statuses += "";
           }
         });
       });
       let finalReopenCount = 0;
       let finalFixedCount = 0;
       if (jiraInstance === "SoleraClassic") {
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
         year: new Date(lastDateHistorie).getFullYear(),
         month: monthNames[new Date(lastDateHistorie).getMonth()],
         updated: dateFormatting(lastDateHistorie),
       });
     });
   }
   let finalReport = [...allFixedAndReopenByUSER, ...missingIssuesInfo];
   console.log("Total de issues COMPLETOS: " + finalReport.length);
   console.log("Total de issues sin procesar" + allIssues.length);
 
   console.log("Issues que fallaron");
   console.log(failedStatus.length);
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