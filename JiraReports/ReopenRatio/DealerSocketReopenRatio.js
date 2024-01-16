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


