const axios = require("axios");
const fs = require('fs');
const XLSX = require('xlsx');
require("dotenv").config();
const {
  isBugDefOpen,
  designedDeveloperObtained,
  designedTesterIsObtained,
  StoryPointsObtained,
  priorityFormatting,
  dateFormatting,
} = require("../../Utils/UtilsOnPrem");
const excelFilePath = '../UtilsOnCloud.xlsx';
const JIRA_URL = process.env.JIRA_URL_OP;
const username = process.env.EMAIL_OP;
const password = process.env.PASSWORD_OP;
let session = {};
const loginUrl = `${JIRA_URL}/auth/1/session`;
const loginData = {
  username: username,
  password: password,
};
let jiraInstance = "Classic";
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

  }