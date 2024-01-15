const axios = require("axios");
const fs = require('fs');
const XLSX = require('xlsx');
const excelFilePath = '../FleetTesting.xlsx';

require("dotenv").config();
const {
    isBugDefOpen,
    isIndependentTasks,
    priorityFormatting,
    dateFormatting,
} = require("../../Utils/UtilsOnCloud");

let JIRA_URL = process.env.JIRA_URL_FLEET;
let API_TOKEN = process.env.API_TOKEN_FLEET;
let EMAIL = process.env.EMAIL_FLEET;
let jiraInstance ='Fleet';
let projectIDS = [
    "XRS",
    "PF",
    "RPE",
    "DCMD",
    "DVIR",
    "MA3PI",
    "OHOS",
    "TM"
];
let startDate = process.env.START_DATE;
let endDate = process.env.END_DATE;
let allIssues = [];
let summary = 0;
let failedStatus = [];
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

const fetchData = async () => {
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
          `${JIRA_URL}/search?jql=project ="${projectIDS[index]}" AND createdDate >= "${startDate} 00:00" AND createdDate <= "${endDate} 23:59" AND issueType in (Story,Task)&startAt=${startAt}&maxResults=${maxResults}`,
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
        console.log(`Error: ${error}`);
        throw error;
      }
    } while (startAt < total);
  }
  console.log("Total de issues: " + summary);
  console.log(allIssues.length);

    allIssues.forEach((issue) => {
      if (issue.fields.issuetype.name === "Task") {
        let countingTasks = isIndependentTasks(issue.fields);
        let bgCount = isBugDefOpen(issue.fields, "Bug");
        let dfCount = isBugDefOpen(issue.fields, "Defect");
        if (countingTasks > 0 && bgCount === 0 && dfCount === 0) {
        } else {
          storiesByProject.push({
            IssueType: issue.fields.issuetype.name,
            StoryNo: issue.key,
            Project: issue.fields.project.name,
            Bugs: isBugDefOpen(issue.fields, "Bug"),
            Defects: isBugDefOpen(issue.fields, "Defect"),
            StoryBugs: 0,
            Developer:
              issue.fields.customfield_10077 !== null
                ? typeof issue.fields.customfield_10077.displayName === "string"
                  ? issue.fields.customfield_10077.displayName
                  : ""
                : "",
            Tester:
              issue.fields.customfield_10136 !== null
                ? typeof issue.fields.customfield_10136.displayName === "string"
                  ? issue.fields.customfield_10136.displayName
                  : ""
                : "",
            StoryPoints:
              issue.fields.customfield_10025 !== null
                ? issue.fields.customfield_10025
                : 0,
            Priority: priorityFormatting(issue.fields.priority, jiraInstance),
            Created: dateFormatting(issue.fields.created),
            Month: monthNames[new Date(issue.fields.created).getMonth()], // March
            Year: new Date(issue.fields.created).getFullYear(),
            Updated: dateFormatting(issue.fields.updated),
          });
        }
      } else {
        storiesByProject.push({
          IssueType: issue.fields.issuetype.name,
          StoryNo: issue.key,
          Project: issue.fields.project.name,
          Bugs: isBugDefOpen(issue.fields, "Bug"),
          Defects: isBugDefOpen(issue.fields, "Defect"),
          StoryBugs: 0,
          Developer:
            issue.fields.customfield_10077 !== null
              ? typeof issue.fields.customfield_10077.displayName === "string"
                ? issue.fields.customfield_10077.displayName
                : ""
              : "",
          Tester:
            issue.fields.customfield_10136 !== null
              ? typeof issue.fields.customfield_10136.displayName === "string"
                ? issue.fields.customfield_10136.displayName
                : ""
              : "",
          StoryPoints:
            issue.fields.customfield_10025 !== null
              ? issue.fields.customfield_10025
              : 0,
          Priority: priorityFormatting(issue.fields.priority, jiraInstance),
          Created: dateFormatting(issue.fields.created),
          Month: monthNames[new Date(issue.fields.created).getMonth()], // March
          Year: new Date(issue.fields.created).getFullYear(),
          Updated: dateFormatting(issue.fields.updated),
        });
      }
    });

    if (fs.existsSync(excelFilePath)) {
      const workbook = XLSX.readFile(excelFilePath);
      const sheetName = workbook.SheetNames[0]; // Suponemos que el archivo Excel tiene una sola hoja
      const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const combinedData = [...existingData, ...storiesByProject];
      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.json_to_sheet(combinedData);
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
      XLSX.writeFile(newWorkbook, excelFilePath);
    }

  }



fetchData();