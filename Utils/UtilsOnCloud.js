
const designedDeveloperObtained = (field) => {
    if (field.hasOwnProperty("customfield_15604")) {
      if (
        field.customfield_15604.displayName !== null &&
        field.customfield_15604.displayName !== undefined &&
        field.customfield_15604.hasOwnProperty("displayName")
      ) {
        return field.customfield_15604.displayName;
      } else {
        return "";
      }
    } else {
      if (field.hasOwnProperty("assignee")) {
        if (
          field.assignee !== null &&
          field.assignee !== undefined &&
          field.assignee.hasOwnProperty("displayName")
        ) {
          return field.assignee.displayName;
        } else {
          return "";
        }
      }
    }
  };
  const designedTesterIsObtained = (field,jiraInstance ) => {
    if (jiraInstance === "DealerSocket") {
      if (
        field.hasOwnProperty("customfield_16268") &&
        field.customfield_16268 !== null
      ) {
        if (
          field.customfield_16268.displayName !== null &&
          field.customfield_16268.displayName !== undefined &&
          field.customfield_16268.hasOwnProperty("displayName")
        ) {
          return field.customfield_16268.displayName;
        } else {
          return "";
        }
      } else {
        if (field.hasOwnProperty("hola")) {
          if (
            field.assignee.displayName !== null ||
            field.assignee.displayName !== undefined
          ) {
            return field.assignee.displayName;
          } else {
            return "";
          }
        } else {
          return "";
        }
      }
    } else {
      if (field.hasOwnProperty("customfield_14411")) {
        if (
          field.customfield_14411.displayName !== null &&
          field.customfield_14411.displayName !== undefined &&
          field.customfield_14411.hasOwnProperty("displayName")
        ) {
          return field.customfield_14411.displayName;
        } else {
          return "";
        }
      } else {
        if (field.hasOwnProperty("hola")) {
          if (
            field.assignee.displayName !== null ||
            field.assignee.displayName !== undefined
          ) {
            return field.assignee.displayName;
          } else {
            return "";
          }
        }
      }
    }
  };
  const obtainedStoryBugs = (issues) => {
    let count = 0;
    if (issues === null) {
      return count;
    }
    if (issues.length === 0) {
      return count;
    }
    issues.forEach((issue) => {
      if (issue.fields.issuetype.name === "Story Bug") {
        count++;
      }
    });
    return count;
  };
  const isBugDefOpen = (issues, type) => {
    // Count in issuesLinks
    let issueLinks = issues.issuelinks;
    let issueST = issues.subtasks;
    let count = 0;
    if (issueLinks !== null && issueLinks !== undefined) {
      if (issueLinks.length !== 0) {
        issueLinks.forEach((issue) => {
          if (issue.outwardIssue || issue.inwardIssue) {
            let currentIssue = [];
            if (issue.outwardIssue) {
              currentIssue.push(issue.outwardIssue);
            }
            if (issue.inwardIssue) {
              currentIssue.push(issue.inwardIssue);
            }

            if (currentIssue.length === 1) {
              if (
                currentIssue[0].fields &&
                currentIssue[0].fields.issuetype &&
                currentIssue[0].fields.issuetype.name === type
              ) {
                count++;
              }
            }

            if (currentIssue.length === 2) {
              if (
                currentIssue[0].fields &&
                currentIssue[0].fields.issuetype &&
                currentIssue[0].fields.issuetype.name === type
              ) {
                count++;
              }
              if (
                currentIssue[1].fields &&
                currentIssue[1].fields.issuetype &&
                currentIssue[1].fields.issuetype.name === type
              ) {
                count++;
              }
            }
          }
        });
      }
    }
    if (issueST !== null && issueST !== undefined) {
      if (issueST.length !== 0) {
        issueST.forEach((issue) => {
          if (issue.fields.issuetype.name === type) {
            count++;
          }
        });
      }
    }
    return count;
  };

  const isIndependentTasks = (issues) => {
    let issueLinks = issues.issuelinks;
    let count = 0;
    if (issueLinks !== null && issueLinks !== undefined) {
      if (issueLinks.length !== 0) {
        issueLinks.forEach((issue) => {
          if (issue.outwardIssue || issue.inwardIssue) {
            let currentIssue = [];
            if (issue.outwardIssue) {
              currentIssue.push(issue.outwardIssue);
            }
            if (issue.inwardIssue) {
              currentIssue.push(issue.inwardIssue);
            }

            if (currentIssue.length === 1) {
              if (
                currentIssue[0].fields &&
                (currentIssue[0].fields.issuetype.name === "Bug" ||
                  currentIssue[0].fields.issuetype.name === "Defect")
              ) {
              } else {
                count++;
              }
            }

            if (currentIssue.length === 2) {
              if (
                currentIssue[0].fields &&
                (currentIssue[0].fields.issuetype.name === "Bug" ||
                  currentIssue[0].fields.issuetype.name === "Defect")
              ) {
              } else {
                count++;
              }
              if (
                currentIssue[1].fields &&
                (currentIssue[1].fields.issuetype.name === "Bug" ||
                  currentIssue[0].fields.issuetype.name === "Defect")
              ) {
              } else {
                count++;
              }
            }
          }
        });
      }
    }

    return count;
  };

  function priorityFormatting(priority,jiraInstance) {
    let finalP;
    console.log(priority);
    if (priority !== null) {
      if (priority.name !== "Not Prioritized") {
        if (jiraInstance === "DealerSocket") {
          finalP = priority.name.split(" – ")[0];
        } else {
          finalP = priority.name.split(" - ")[0];
        }
      } else {
        finalP = priority.name;
      }
    }
    return finalP;
  }

  function dateFormatting(fechaString) {
    var fecha = new Date(fechaString);
    var mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    var dia = fecha.getDate().toString().padStart(2, "0");
    var anio = fecha.getFullYear();
    var horas = fecha.getHours() % 12 || 12;
    var minutos = fecha.getMinutes().toString().padStart(2, "0");
    var sufijo = fecha.getHours() >= 12 ? "PM" : "AM";

    return `${mes}/${dia}/${anio}`;
  }

  module.exports = {
    designedDeveloperObtained,
    designedTesterIsObtained,
    obtainedStoryBugs,
    isBugDefOpen,
    isIndependentTasks,
    priorityFormatting,
    dateFormatting,
  };
  