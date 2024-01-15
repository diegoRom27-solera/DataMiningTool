const designedDeveloperObtained = (field, jiraInstance) => {
    if (field.hasOwnProperty("customfield_15604")) {
      if (
        field.customfield_15604 !== null &&
        field.customfield_15604 !== undefined
      ) {
        return field.customfield_15604.displayName;
      } else {
        return "";
      }
    } else {
      if (
        field.hasOwnProperty("assignee") &&
        jiraInstance !== "Qapter"
      ) {
        if (field.assignee !== null) {
          return field.assignee.displayName;
        } else {
          return "";
        }
      } else {
        return "";
      }
    }
  };
  const designedTesterIsObtained = (field,jiraInstance) => {
    if (field.hasOwnProperty("customfield_14411")) {
      if (
        field.customfield_14411 !== null &&
        field.customfield_14411 !== undefined
      ) {
        return field.customfield_14411.displayName;
      } else {
        return "";
      }
    } else {
      if (
        field.hasOwnProperty("assignee") &&
        jiraInstance !== "Qapter"
      ) {
        if (
          field.assignee !== null &&
          field.assignee !== undefined &&
          field.assignee.hasOwnProperty("displayName")
        ) {
          return field.assignee.displayName;
        } else {
          return "";
        }
      } else {
        return "";
      }
    }
  };
  
  const StoryPointsObtained = (field,jiraInstance) => {
    if (jiraInstance === "Qapter") {
      if (field.hasOwnProperty("customfield_10198")) {
        console.log(field.customfield_10198);
        if (
          field.customfield_10198 !== null &&
          field.customfield_10198 !== undefined
        ) {
          return field.customfield_10198;
        } else {
          return 0;
        }
      }
    } else {
      if (field.hasOwnProperty("customfield_10198")) {
        if (
          field.customfield_10198 !== null &&
          field.customfield_10198 !== undefined
        ) {
          return field.customfield_10198;
        } else {
          return 0;
        }
      }
    }
  };
  
  const isBugDefOpen = (issues, type, jiraInstance) => {
    // Count in issuesLinks
  
    let issueLinks = issues.issuelinks;
    let issueST = issues.subtasks;
    let typeIssue = type;
  
    if (type === "Story Bug" && jiraInstance === "Qapter") {
      typeIssue = "StoryBug";
    }
  
    let count = 0;
    if (issueLinks !== null && issueLinks !== undefined) {
      if (issueLinks.length !== 0) {
        issueLinks.forEach((issue) => {
          if (issue.outwardIssue || issue.inwardIssue) {
            let currentIssue = [];
            if (issue.outwardIssue && issue.type.outward !== "Parent Issue") {
              currentIssue.push(issue.outwardIssue);
            }
            if (issue.inwardIssue && issue.type.inward !== "Parent Issue") {
              currentIssue.push(issue.inwardIssue);
            }
            if (currentIssue.length === 1) {
              if (
                currentIssue[0].fields &&
                currentIssue[0].fields.issuetype &&
                currentIssue[0].fields.issuetype.name === typeIssue
              ) {
                count++;
              }
            }
  
            if (currentIssue.length === 2) {
              if (
                currentIssue[0].fields &&
                currentIssue[0].fields.issuetype &&
                currentIssue[0].fields.issuetype.name === typeIssue
              ) {
                count++;
              }
              if (
                currentIssue[1].fields &&
                currentIssue[1].fields.issuetype &&
                currentIssue[1].fields.issuetype.name === typeIssue
              ) {
                count++;
              }
            }
          }
        });
      }
    }
  
    // Fixear esto
    if (issueST !== null && issueST !== undefined) {
      if (issueST.length !== 0) {
        issueST.forEach((issue) => {
          if (issue.fields.issuetype.name === typeIssue) {
            count++;
          }
          if (issue.fields.issuetype.name === "StoryBug") {
            console.log("Conto un StoryBug");
          }
        });
      }
    }
  
    return count;
  };
  
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
  
  function priorityFormatting(priority) {
    let finalP;
    if (priority !== null) {
      if (priority.name !== "Not Prioritized") {
        finalP = priority.name.split(" - ")[0];
      } else {
        finalP = priority.name;
      }
    }
    return finalP;
  }

  module.exports = {
    designedDeveloperObtained,
    designedTesterIsObtained,
    StoryPointsObtained,
    isBugDefOpen,
    dateFormatting,
    priorityFormatting
};