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
let jiraInstance = "Qapter";
let projectIDS = [
    'AOMX',
    'SHL',
    "BMW",
    "AXNCH",
    "AXNGA",
    "AFW",
    "FUSI",
    "AXNCEE",
    "QCCZSK",
    "ATBAU",
    "POL",
    "AUSM",
    "DTCEE",
    "ECHE",
    "GTLS",
    "CZSKS",
    "RWCTCEM",
    "HUSS",
    "AUTQC",
    "KFZV",
    "QCBR",
    "QCMX",
    "I360",
    "BRAXW",
    "SVD",
    "SXAS",
    "SXAUT",
    "SD",
    "SLD",
    "SDLD",
    "SHE",
    "EA",
    "DRVP",
    "VIDPL",
    "EX",
    "SCGEN",
    "QCLPLF",
    "ANETAU",
    "ANETAPAC",
    "GLOBALIP",
    "MP",
    "QT",
    "QTBL",
    "QMOB",
    "AXNTT",
    "CALC",
    "NEWTON",
    "VPI",
    "TIME",
    "DWPRO",
    "SNLDADB",
    "DATAPROC",
    "AFLW",
    "QVISUITE",
    "ITR",
    "IRW",
    "QCUK",
    "AUDAVIN",
    "AUDAVID",
    "AP",
    "QCES",
    "AGRA",
    "FMSDATA",
    "DCAP",
    "ANETFR",
    "SNETFR",
    "UA",
    "IMXTO",
    "CLA360TI",
    "CLALU",
    "IRES",
    "IVO",
    "QKCL",
    "VICDNA",
    "CAPHPIPRAP",
    "CAPHPIPRMF",
    "FMSMAPP",
    "FMSQSMR",
    "FMSSCI",
    "GIC",
    "PET",
    "AEG",
    "REC",
    "AUTAC",
    "RAM"
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



const fetchData = async (url) => {
    let issueTypes = `Bug, Defect, StoryBug`;
    let reopenworkFlowStatuses = [
      /-Resolved to In Progress-/g,
      /-In Testing to In Progress-/g,
      /-In Acceptance to In Progress-/g,
    ];
    let fixedWorkFlowStatuses = [/-In Progress to Ready for Testing-/g];
    let storyBugsFixedWorkFlowStatuses = [/-In Progress to Done-/g];
    let storyBugsReopenWorkFlowStatuses = [/-Done to In Progress-/g];
    
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
      failedStatus.push({
        type: "Initial Login Error",
        data: {
          project: "N/A",
        },
      });
    }
  } catch (loginError) {
    console.log(`Error: ${loginError}`);
  }
  console.log("Total de issues: " + allIssues.length);
  // esta variable contiene los issues que tienen menos de 100 en el historial de cambios
  if (jiraInstance === "Qapter") {
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

        if (jiraInstance === "Qapter") {
          if (issue.fields.issuetype.name !== "StoryBug") {
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
          if (issue.fields.issuetype.name === "StoryBug") {
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

      if (jiraInstance === "Qapter") {
        if (issue.issueType !== "StoryBug") {
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
        if (issue.issueType === "StoryBug") {
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

}