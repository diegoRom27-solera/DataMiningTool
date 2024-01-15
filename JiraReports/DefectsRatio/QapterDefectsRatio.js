const axios = require("axios");
require("dotenv").config();
const {
  isBugDefOpen,
  designedDeveloperObtained,
  designedTesterIsObtained,
  StoryPointsObtained,
  priorityFormatting,
  dateFormatting,
} = require("../../Utils/UtilsOnPrem");

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
let endDate = process.env.END_DATE;
let allIssues = [];
const session = {};
const JIRA_URL = process.env.JIRA_URL_OP;
const jiraInstance = "Qapter";
const username = process.env.EMAIL_OP;
const password = process.env.PASSWORD_OP;
const loginUrl = `${JIRA_URL}/auth/1/session`;
const loginData = {
  username: username,
  password: password,
};
let summary = 0;
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
let storiesByProject = [];
let failedStatus = [];
const fetchDaya = async () => {
    console.log("Fetching data...");
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
          `${JIRA_URL}/api/2/search?jql=project ="${projectIDS[index]}" AND createdDate >= "${startDate} 00:00" AND createdDate <= "${endDate} 23:59" AND issueType in (Story,Task)&startAt=${startAt}&maxResults=${maxResults}`
        );
        do {
          try {
            const response = await axios.get(
              `${JIRA_URL}/api/2/search?jql=project ="${projectIDS[index]}" AND createdDate >= "${startDate} 00:00" AND createdDate <= "${endDate} 23:59" AND issueType in (Story,Task)&startAt=${startAt}&maxResults=${maxResults}`,
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

              summary += total;
              console.log("Respuesta total: " + total + " startAt: " + startAt);

              startAt += maxResults;
              console.log(startAt);
              let issues = response.data.issues;
              allIssues = [...allIssues, ...issues];
              console.log(allIssues.length);
            }
          } catch (error) {
            console.log(error);
            throw error;
          }
        } while (startAt < total);
      }
      console.log("Total de issues: " + summary);
      allIssues.forEach((issue) => {
        storiesByProject.push({
          IssueType: issue.fields.issuetype.name,
          StoryNo: issue.key,
          Project: issue.fields.project.name,
          Bugs: isBugDefOpen(issue.fields, "Bug", jiraInstance),
          Defects: isBugDefOpen(issue.fields, "Defect", jiraInstance),
          StoryBugs: isBugDefOpen(issue.fields, "Story Bug", jiraInstance),
          Developer: designedDeveloperObtained(issue.fields, jiraInstance),
          Tester: designedTesterIsObtained(issue.fields, jiraInstance),
          StoryPoints: StoryPointsObtained(issue.fields, jiraInstance),
          Priority: priorityFormatting(issue.fields.priority),
          Created: dateFormatting(issue.fields.created),
          Month: monthNames[new Date(issue.fields.created).getMonth()], // March
          Year: new Date(issue.fields.created).getFullYear(),
          Updated: dateFormatting(issue.fields.updated),
        });
      });
    } else {
      console.log("Login failed");
    }
  } catch (loginError) {
    console.log(loginError);
    throw loginError;
  }
};

fetchDaya();