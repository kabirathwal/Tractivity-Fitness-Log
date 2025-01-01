'use strict'

// database operations.
// Async operations can always fail, so these are all wrapped in try-catch blocks
// so that they will always return something
// that the calling function can use. 

module.exports = {
  testDB: testDB,
  post_activity: post_activity,
  get_most_recent_planned_activity_in_range: get_most_recent_planned_activity_in_range,
  delete_past_activities_in_range: delete_past_activities_in_range,
  get_most_recent_entry: get_most_recent_entry,
  get_similar_activities_in_range: get_similar_activities_in_range,
  get_all: get_all,
  new_user: new_user,
  GetInfo: GetInfo,
  get_name: get_name,
}

// using a Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// our activity verifier
const act = require('./activity');

// SQL commands for ActivityTable
const insertDB = "insert into ActivityTable (activity, date, amount, userid) values (?,?,?,?)"
const getOneDB = "select * from ActivityTable where activity = ? and date = ? and userid = ?";
const allDB = "select * from ActivityTable where activity = ? and userid = ?";
const deletePrevPlannedDB = "DELETE FROM ActivityTable WHERE userid = ? and amount < 0 and date BETWEEN ? and ?";
const getMostRecentPrevPlannedDB = "SELECT rowIdNum, activity, MAX(date), amount FROM ActivityTable WHERE userid = ? and amount <= 0 and date BETWEEN ? and ?";
const getMostRecentDB = "SELECT MAX(rowIdNum), activity, date, amount FROM ActivityTable WHERE userid = ?";
const getPastWeekByActivityDB = "SELECT * FROM ActivityTable WHERE userid = ? and activity = ? and date BETWEEN ? and ? ORDER BY date ASC";

const insertDB_ID = "insert into Profile (userid, firstname) values (?,?)";
const allDB_ID = "select * from Profile where firstname = ?";
const getOneDB_ID = "select * from Profile where userid = ? and firstname = ?";
const getFromRow = "select * from Profile where rowIDNum = ?";
const getfromid = "select * from Profile where userid = ?";

// Testing function loads some data into DB. 
// Is called when app starts up to put fake 
// data into db for testing purposes.
// Can be removed in "production". 
async function testDB () {
  
  // for testing, always use today's date
  
  

  let gmtDate = new Date();
  let time = new Date(gmtDate.toLocaleDateString()).getTime();


   await db.run(insertDB, ["Run", time, 9, "33445566"])



  // some examples of getting data out of database
  
  // look at the item we just inserted
  
}

/**
 * Insert activity into the database
 * @param {Activity} activity 
 * @param {string} activity.activity - type of activity
 * @param {number} activity.date - ms since 1970
 * @param {float} activity.scalar - measure of activity conducted
 */
async function post_activity(activity, userid) {
  try {
    await db.run(insertDB, [activity.activity, activity.date, activity.scalar, userid]);
  } catch (error) {
    console.log("error", error)
  }
}

async function new_user(userid, name) {

  let res = await db.get(getOneDB_ID,[userid, name]);

  if(res == undefined){
    try {
    await db.run(insertDB_ID, [userid, name]);
    let res2 = await db.get(getOneDB_ID,[userid, name]);
    
    return res2.rowIdNum;
  } catch (error) {
    console.log("error", error)
  }
  }

  else{
    return res.rowIdNum;
  }
}

async function GetInfo(row) {

  let res = await db.get(getFromRow,[row]);

  return res;
}

async function get_name(userid, username) {

  try{
    let res = await db.get(getOneDB_ID,[userid, username]);
    return res.firstName;

  }
  catch{
    return null;
  }

  
}




/**
 * Get the most recently planned activity that falls within the min and max 
 * date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_planned_activity_in_range(min, max, userid) {
  try {
    let results = await db.get(getMostRecentPrevPlannedDB, [userid, min, max]);
    return (results.rowIdNum != null) ? results : null;
  }
  catch (error) {
    console.log("error", error);
    return null;
  }
}



/**
 * Get the most recently inserted activity in the database
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_entry(userid) {
  try {
    let result = await db.get(getMostRecentDB, [userid]);
    return (result['MAX(rowIdNum)'] != null) ? result : null;
  }
  catch (error) {
    console.log(error);
    return null;
  }
}


/**
 * Get all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {string} activityType - type of activity
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Array.<Activity>} similar activities
 */
async function get_similar_activities_in_range(activityType, min, max, userid) {
  try {
    let results = await db.all(getPastWeekByActivityDB, [userid, activityType, min, max]);
    return results;
  }
  catch (error) {
    console.log(error);
    return [];
  }
}


/**
 * Delete all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 */
async function delete_past_activities_in_range(min, max, userid) {
  try {
    await db.run(deletePrevPlannedDB, [userid, min, max]);
  }
  catch (error) {
    console.log(error);
  }
}

// UNORGANIZED HELPER FUNCTIONS


/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
function newUTCTime() {
  let gmtDate = new Date()
  return (new Date(gmtDate.toLocaleDateString())).getTime()
}

function randomNumber(min, max, round = true) { 
  let val =  Math.random() * (max - min) + min
  if (round) {
    return Math.round(val * 100) / 100
  } else {
    return Math.floor(val)
  }
}

// dumps whole table; useful for debugging
async function get_all() {
  try {
    let results = await db.all("select * from ActivityTable", []);
    return results;
  } 
  catch (error) {
    console.log(error);
    return [];
  }
}