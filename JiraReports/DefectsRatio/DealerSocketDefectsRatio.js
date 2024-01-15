const axios = require("axios");
require("dotenv").config();
const {
    designedDeveloperObtained,
    designedTesterIsObtained,
    isBugDefOpen,
    priorityFormatting,
    dateFormatting,
} = require("../../Utils/UtilsOnCloud");


let JIRA_URL = process.env.JIRA_URL_DS;
let API_TOKEN = process.env.API_TOKEN_DS;
let EMAIL = process.env.EMAIL_DS;
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
    "IDMS"
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
    storiesByProject.push({
      IssueType: issue.fields.issuetype.name,
      StoryNo: issue.key,
      Project: issue.fields.project.name,
      Bugs: isBugDefOpen(issue.fields, "Bug"),
      Defects: isBugDefOpen(issue.fields, "Defect"),
      StoryBugs: isBugDefOpen(issue.fields, "Story Bug"),
      Developer: designedDeveloperObtained(issue.fields),
      Tester: designedTesterIsObtained(issue.fields, jiraInstance),
      StoryPoints:
        issue.fields.customfield_10004 !== null
          ? issue.fields.customfield_10004
          : 0,
      Priority: priorityFormatting(issue.fields.priority, jiraInstance),
      Created: dateFormatting(issue.fields.created),
      Month: monthNames[new Date(issue.fields.created).getMonth()], // March
      Year: new Date(issue.fields.created).getFullYear(),
      Updated: dateFormatting(issue.fields.updated),
    });
  });

//   res.send({
//     reportData: storiesByProject,
//     failedResults: failedStatus,
//   });





}

fetchData();