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
let endDate = process.env.END_DATE;
let allIssues = [];
const session = {};
const JIRA_URL = process.env.JIRA_URL_OP;
const jiraInstance = "Classic";
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
const fetchData = async () => {
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

fetchData();