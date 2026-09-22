/************************************************
 * SHEETS
 ************************************************/

const DATA_SHEET = "بيانات";

const ABSENCE_SHEET = "Sheet1";

const USERS_SHEET = "Users";

const FIRST_ROW = 2;

const BACKEND_VERSION = "2026-07-29-school-year-A3";

/************************************************
 * MAIN API
 ************************************************/

function doPost(e){

  try{

    const body =
      JSON.parse(
        e.postData.contents
      );

    const action =
      body.action;

    const data =
      body.data || {};

    let result = null;

    switch(action){
case "getTodayStudentStatus":
  result = getTodayStudentStatus(data);
break;
case "getStudentMonthlyAbsence":
  result = getStudentMonthlyAbsenceV2(data);
break;
case "getTeachersStats":
  result = getTeachersStats();
break;

case "addTeacher":
  result = addTeacher(data);
break;

case "deleteTeacher":
  result = deleteTeacher(data);
break;
case "getDailyReport":
  result = getDailyReport(data);
break;

case "getMonthlyReport":
  result = getMonthlyReport(data);
break;
case "getUsers":
  result = getUsers();
break;

case "addUser":
  result = addUser(data);
break;

case "updateUser":
  result = updateUser(data);
break;

case "deleteUser":
  result = deleteUser(data);
break;
case "getBackupData":
  result = getBackupData();
break;
      case "login":
        result = login(
          data.username,
          data.password
        );
      break;

      case "getClasses":
        result = getClasses();
      break;

      case "getTeachers":
        result = getTeachers();
      break;

      case "getSchedule":
        result = getSchedule();
      break;

      case "getStudents":
        result = getStudents(
          data.className,
          data.lang,
          data.section
        );
      break;

      case "saveAbsence":
        result = saveAbsence(
          data.records
        );
      break;

      case "getDashboardStats":
        result = getDashboardStats();
      break;

      case "updateStudent":
        result = updateStudent(data);
      break;

      case "deleteStudent":
        result = deleteStudent(data);
      break;

      case "getTodayStudentStatus":
        result = getTodayStudentStatus(data);
      break;

      case "getStudentMonthlyAbsence":
        result = getStudentMonthlyAbsence(data);
      break;
      case "getAbsenceClasses":
      result = getAbsenceClasses();
      break;
      case "addStudent":
      result = addStudent(data);
      break;

      case "updateStudent":
      result = updateStudent(data);
      break;

     case "deleteStudent":
     result = deleteStudent(data);
     break;
     case "getSettings":
     result = getSettings();
     break;

      case "saveSettings":

        result = saveSettings(data);

      break;
      case "getActiveSession":
      result = getActiveSession();
      break;
     case "getTodayAbsenceSummary":
     result = getTodayAbsenceSummaryV2();
     break;
     case "getDashboardLiveData":
  result = getDashboardLiveData();
break;
case "getAscSettings": result = ascGetSettings_(); break;
case "saveAscSettings": result = ascSaveSettings_(data); break;
case "importAscTimetable": result = ascImport_(data); break;
case "getAscAlerts": result = ascGetAlerts_(); break;
case "getMonitorData":
  result = getMonitorData();
break;
case "getParentPhones":
  result = getParentPhones();
break;
case "getStudentMonthAttendanceEdit":
  result = getStudentMonthAttendanceEdit(data);
break;

case "updateStudentMonthAttendance":
  result = updateStudentMonthAttendance(data);
break;
case "getSiteStatus":
  result = getSiteStatus();
break;

case "saveSiteStatus":
  result = saveSiteStatus(data);
break;
case "getWeekendSettings":
  result = getWeekendSettings();
break;

case "saveWeekendSettings":
  result = saveWeekendSettings(data);
break;
case "getAuditLog":
  result = getAuditLog();
break;
case "clearAuditLog":
  result = clearAuditLog(data);
break;
case "getStudentAttendanceByDate":
  result = getStudentAttendanceByDate(data);
break;
case "saveStudentAttendanceByDate":
  result = saveStudentAttendanceByDate(data);
break;
case "getClassTodaySessionAttendanceEdit":
  result = getClassTodaySessionAttendanceEdit(data);
break;

case "updateClassSessionAttendanceEdit":
  result = updateClassSessionAttendanceEdit(data);
break;
case "getAllTodayAbsentStudents":
  result = getAllTodayAbsentStudents();
break;
case "getAttendanceInitData":
  result = getAttendanceInitData();
break;
      default:
        result = {
          success:false,
          message:"Invalid Action"
        };

    }

    return json(result);

  }catch(error){

    return json({
      success:false,
      error:error.toString()
    });

  }

}
function getTodayStudentStatus(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("Sheet1");

    const START_ROW = 8;
    const HEADER_ROW = 7;
    const START_COL = 5;

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers =
      sheet
      .getRange(
        HEADER_ROW,
        START_COL,
        1,
        lastCol - START_COL + 1
      )
      .getDisplayValues()[0];

    const rows =
      sheet
      .getRange(
        START_ROW,
        1,
        lastRow - START_ROW + 1,
        lastCol
      )
      .getDisplayValues();

    const result = [];

    for(let i=0;i<rows.length;i++){

      const row = rows[i];

      const seat = String(row[0]).trim();
      const name = String(row[1]).trim();
      const className = String(row[2]).trim();

      if(!seat || !name){
        continue;
      }

      if(
        data.className &&
        data.className !== "all" &&
        className !== data.className
      ){
        continue;
      }

      let todayStatus = "لم يسجل";
      const sessions = [];

      for(let c=0;c<headers.length;c++){

        const header = String(headers[c]).trim();

        if(!header.includes(today)){
          continue;
        }

        const value =
          String(row[START_COL - 1 + c]).trim();

        if(value === "غ"){

          todayStatus = "غائب";

          sessions.push({
            session:header,
            status:"غ"
          });

        }else if(value === "ح"){

          if(todayStatus !== "غائب"){
            todayStatus = "حاضر";
          }

          sessions.push({
            session:header,
            status:"ح"
          });

        }

      }

      result.push({
        seat:seat,
        name:name,
        className:className,
        todayStatus:todayStatus,
        sessions:sessions
      });

    }

    return result;

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getStudentMonthlyAbsenceV2(data){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName("حصر الغياب");

  const START_ROW = 8;
  const HEADER_ROW = 7;
  const START_COL = 5;

  const keyword = String(data.keyword || "").trim();
  const searchType = String(data.searchType || "seat").trim();
  const month = String(data.month || "").trim().padStart(2,"0");

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers = sheet
    .getRange(HEADER_ROW,START_COL,1,lastCol - START_COL + 1)
    .getDisplayValues()[0];

  const rows = sheet
    .getRange(START_ROW,1,lastRow - START_ROW + 1,lastCol)
    .getDisplayValues();

  function getHeaderDate(header){

    header = String(header || "").trim();

    if(!header){
      return "";
    }

    if(header.indexOf(" - ") !== -1){
      header = header.split(" - ")[0].trim();
    }

    let match1 = header.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    let match2 = header.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if(match1){
      return (
        match1[1] + "-" +
        String(match1[2]).padStart(2,"0") + "-" +
        String(match1[3]).padStart(2,"0")
      );
    }

    if(match2){
      return (
        match2[3] + "-" +
        String(match2[2]).padStart(2,"0") + "-" +
        String(match2[1]).padStart(2,"0")
      );
    }

    return "";

  }

  const result = [];

  for(let i=0;i<rows.length;i++){

    const row = rows[i];

    const seat = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    const className = String(row[2] || "").trim();

    let matched = false;

    if(searchType === "seat"){
      matched = seat === keyword;
    }else{
      matched = name.toLowerCase().includes(keyword.toLowerCase());
    }

    if(!matched){
      continue;
    }

    const absenceDays = {};

    for(let c=0;c<headers.length;c++){

      const header = String(headers[c] || "").trim();
      const dateOnly = getHeaderDate(header);

      if(!dateOnly){
        continue;
      }

      const headerMonth =
        dateOnly.split("-")[1];

      if(headerMonth !== month){
        continue;
      }

      const value =
        String(row[START_COL - 1 + c] || "")
        .replace(/\s/g,"")
        .trim();

      if(value.indexOf("غ") !== -1){

        if(!absenceDays[dateOnly]){
          absenceDays[dateOnly] = {
            date:dateOnly,
            sessions:0,
            headers:[]
          };
        }

        absenceDays[dateOnly].sessions++;
        absenceDays[dateOnly].headers.push(header);

      }

    }

    const days =
      Object.keys(absenceDays)
      .sort()
      .map(d=>absenceDays[d]);

    result.push({
      seat:seat,
      name:name,
      className:className,
      totalAbsence:days.length,
      details:days.map(d=>d.date)
    });

  }

  return result;

}

/************************************************
 * JSON
 ************************************************/

function json(data){

  return ContentService
  .createTextOutput(
    JSON.stringify(data)
  )
  .setMimeType(
    ContentService
    .MimeType
    .JSON
  );

}

/************************************************
 * LOGIN
 ************************************************/

function login(
  username,
  password
){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName(
      USERS_SHEET
    );

  const values =
    sheet
    .getDataRange()
    .getValues();

  for(
    let i=1;
    i<values.length;
    i++
  ){

    const row =
      values[i];

    if(

      row[0] == username &&

      row[1] == password

    ){

      return {

        success:true,

        username:row[0],

        role:row[2]

      };

    }

  }

  return {

    success:false

  };

}

/************************************************
 * GET CLASSES
 ************************************************/

function getClasses(){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName(
      DATA_SHEET
    );

  const values =
    sheet
    .getRange(
      FIRST_ROW,
      3,
      sheet.getLastRow()-1,
      1
    )
    .getValues()
    .flat();

  return [

    ...new Set(

      values.filter(String)

    )

  ];

}

/************************************************
 * GET TEACHERS
 ************************************************/

function getTeachers(){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName(
      DATA_SHEET
    );

  const values =
    sheet
    .getRange(
      FIRST_ROW,
      7,
      sheet.getLastRow()-1,
      1
    )
    .getValues()
    .flat();

  return [

    ...new Set(

      values.filter(String)

    )

  ];

}

/************************************************
 * GET SESSIONS
 ************************************************/

function getSchedule(){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName(
      DATA_SHEET
    );

  /**************************************
   * الجلسات من I7:Q7
   **************************************/

  const values =
    sheet
    .getRange(
      "I7:Q7"
    )
    .getValues()[0];

  const arr = [];

  for(
    let i=0;
    i<values.length;
    i++
  ){

    const session =
      values[i];

    if(session){

      arr.push({

        id:i+1,

        name:session

      });

    }

  }

  return arr;

}

/************************************************
 * GET STUDENTS
 ************************************************/

function getStudents(
  className,
  lang,
  section
){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName(
      DATA_SHEET
    );

  const values =
    sheet
    .getRange(
      FIRST_ROW,
      1,
      sheet.getLastRow()-1,
      8
    )
    .getValues();

  const arr = [];

  for(
    let i=0;
    i<values.length;
    i++
  ){

    const row =
      values[i];

    const seat =
      row[0];

    const name =
      row[1];

    const cls =
      row[2];

    const code =
      row[3];

    const studentLang =
      row[4];

    const studentSection =
      row[5];

    /****************************************/

    if(
      className &&
      cls !== className
    ){

      continue;

    }

    if(
      lang &&
      lang !== "all" &&
      studentLang !== lang
    ){

      continue;

    }

    if(
      section &&
      section !== "all" &&
      studentSection !== section
    ){

      continue;

    }

    /****************************************/

    arr.push({

      seat:seat,

      name:name,

      class:cls,

      code:code,

      lang:studentLang,

      section:studentSection

    });

  }

  return arr;

}

/************************************************
 * SAVE ABSENCE
 ************************************************/

function saveAbsence(records){

  try{

    if(!records || records.length === 0){
      return {
        success:false,
        error:"لا توجد بيانات للحفظ"
      };
    }

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("Sheet1");

    const START_ROW = 8;
    const HEADER_ROW = 7;
    const START_COL = 5; // E

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    const sessionId =
      Number(records[0].sessionId);

    const sessionName =
      records[0].sessionName || ("Session " + sessionId);

    if(!sessionId || isNaN(sessionId)){
      return {
        success:false,
        error:"رقم الجلسة غير صحيح"
      };
    }

    const className = String(records[0].className || "").trim();
    if(!className || records.some(r => String(r.className || "").trim() !== className)){
      return {success:false,error:"يجب أن تنتمي جميع السجلات إلى فصل واحد"};
    }
    const targetCol =
      START_COL + sessionId - 1;

    // كتابة التاريخ + اسم الجلسة في الصف 7
    sheet
      .getRange(HEADER_ROW,targetCol)
      .setValue(today + " - " + sessionName);

    const lastRow =
      sheet.getLastRow();

    if(lastRow < START_ROW)return {success:false,error:"لا توجد بيانات طلاب"};
    const studentRows = sheet.getRange(START_ROW,1,lastRow-START_ROW+1,3).getDisplayValues();
    const seats = studentRows.map(r=>String(r[0]).trim());
    const valid = records.every(r=>studentRows.some(row=>String(row[0]).trim()===String(r.seat).trim() && String(row[2]).trim()===className));
    if(!valid)return {success:false,error:"بعض الطلاب غير موجودين في الفصل المحدد؛ لم يتم الحفظ"};

    let saved = 0;

    for(let i=0;i<records.length;i++){

      const r = records[i];

      const seat =
        String(r.seat).trim();

      let rowIndex = -1;

      for(let x=0;x<seats.length;x++){

        if(String(seats[x]).trim() === seat){
          rowIndex = x;
          break;
        }

      }

      if(rowIndex === -1){
        continue;
      }

      const realRow =
        START_ROW + rowIndex;

      const cell =
        sheet.getRange(realRow,targetCol);

      cell.setValue(
  r.status === "غ"
  ? "غ"
  : "ح"
);

      cell.setComment(
        "المعلم: " + r.teacher +
        "\nالتاريخ: " + today +
        "\nالجلسة: " + sessionName
      );

      saved++;

    }

    SpreadsheetApp.flush();
    if(saved !== records.length || saved === 0){
      return {success:false,error:"لم يتم حفظ جميع الطلاب؛ المحفوظ " + saved + " من " + records.length};
    }
    const log = ascSheet_("ASC_SaveLog",["Date","Class","Session","SavedAt","Count","Teacher"]);
    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    try{
      const values = log.getDataRange().getDisplayValues();
      const key = today + "|" + className + "|" + sessionId;
      let existing = 0;
      for(let i=1;i<values.length;i++) if(values[i][0]+"|"+values[i][1]+"|"+values[i][2]===key){existing=i+1;break;}
      const record = [today,className,sessionId,new Date(),saved,String(records[0].teacher || "")];
      if(existing) log.getRange(existing,1,1,6).setValues([record]);
      else log.appendRow(record);
      SpreadsheetApp.flush();
    }finally{lock.releaseLock();}
    return {success:true,message:"تم حفظ " + saved + " طالب",saved:saved};

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}

/************************************************
 * DASHBOARD
 ************************************************/

function getDashboardStats(){

  try{

    const sheet = SpreadsheetApp.getActive().getSheetByName("Sheet1");

    const START_ROW = 8;
    const START_COL = 5;
    const HEADER_ROW = 7;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if(lastRow < START_ROW){
      return {
        totalStudents:0,
        totalAbsence:0,
        totalPresent:0,
        attendanceRate:0,
        classes:[],
        values:[],
        table:[],
        absentStudents:[]
      };
    }

    const headers =
      sheet
      .getRange(HEADER_ROW,1,1,lastCol)
      .getValues()[0];

    const data =
      sheet
      .getRange(
        START_ROW,
        1,
        lastRow - START_ROW + 1,
        lastCol
      )
      .getValues();

    let totalStudents = 0;
    let totalAbsence = 0;
    let totalPresent = 0;

    const classStats = {};
    const absentMap = {};

    for(let i=0;i<data.length;i++){

      const row = data[i];

      const seat = row[0];
      const name = row[1];
      const className = row[2];

      if(!seat || !className){
        continue;
      }

      totalStudents++;

      if(!classStats[className]){
        classStats[className] = {
          className:className,
          students:0,
          absent:0,
          present:0
        };
      }

      classStats[className].students++;

      const absentDays = {};
      const presentDays = {};

      for(let c=START_COL-1;c<row.length;c++){

        const status = row[c];

        if(status !== "غ" && status !== "ح"){
          continue;
        }

        const header = String(headers[c] || "").trim();

        let dayKey = header.split(" ")[0];
        dayKey = dayKey.split("-S")[0];
        dayKey = dayKey.split("-جلسة")[0];

        if(!dayKey){
          dayKey = "day-" + c;
        }

        if(status === "غ"){
          absentDays[dayKey] = true;
        }

        if(status === "ح"){
          presentDays[dayKey] = true;
        }

      }

      const absentCountForStudent =
        Object.keys(absentDays).length;

      const presentCountForStudent =
        Object.keys(presentDays)
        .filter(day => !absentDays[day])
        .length;

      if(absentCountForStudent > 0){

        totalAbsence += absentCountForStudent;
        classStats[className].absent += absentCountForStudent;

        const key = String(seat);

        absentMap[key] = {
          seat:seat,
          name:name,
          className:className,
          count:absentCountForStudent
        };

      }

      if(presentCountForStudent > 0){

        totalPresent += presentCountForStudent;
        classStats[className].present += presentCountForStudent;

      }

    }

    const table = [];

    for(const key in classStats){

      const item = classStats[key];
      const total = item.absent + item.present;

      item.attendanceRate =
        total > 0
          ? Math.round((item.present / total) * 100)
          : 0;

      table.push(item);

    }

    const absentStudents =
      Object
      .values(absentMap)
      .sort((a,b)=>b.count-a.count);

    const totalRecords =
      totalAbsence + totalPresent;

    return {
      totalStudents:totalStudents,
      totalAbsence:totalAbsence,
      totalPresent:totalPresent,
      attendanceRate:
        totalRecords > 0
          ? Math.round((totalPresent / totalRecords) * 100)
          : 0,
      classes:table.map(x=>x.className),
      values:table.map(x=>x.absent),
      table:table,
      absentStudents:absentStudents
    };

  }catch(error){

    return {
      totalStudents:0,
      totalAbsence:0,
      totalPresent:0,
      attendanceRate:0,
      classes:[],
      values:[],
      table:[],
      absentStudents:[],
      error:error.toString()
    };

  }

}
function updateStudent(student){

  try{

    const sheet = SpreadsheetApp.getActive().getSheetByName("بيانات");
    const FIRST_ROW = 8;

    const lastRow = sheet.getLastRow();

    const seats = sheet
      .getRange(FIRST_ROW,1,lastRow - FIRST_ROW + 1,1)
      .getValues()
      .flat();

    const oldSeat = String(student.oldSeat).trim();

    let rowIndex = -1;

    for(let i=0;i<seats.length;i++){
      if(String(seats[i]).trim() === oldSeat){
        rowIndex = FIRST_ROW + i;
        break;
      }
    }

    if(rowIndex === -1){
      return {
        success:false,
        error:"لم يتم العثور على الطالبة"
      };
    }

    sheet.getRange(rowIndex,1,1,6).setValues([[
      student.seat,
      student.name,
      student.className,
      student.code,
      student.lang,
      student.section
    ]]);

    return {
      success:true,
      message:"تم تعديل بيانات الطالبة"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}

function deleteStudent(data){

  try{

    const sheet = SpreadsheetApp.getActive().getSheetByName("بيانات");
    const FIRST_ROW = 8;

    const lastRow = sheet.getLastRow();

    const seats = sheet
      .getRange(FIRST_ROW,1,lastRow - FIRST_ROW + 1,1)
      .getValues()
      .flat();

    const seat = String(data.seat).trim();

    let rowIndex = -1;

    for(let i=0;i<seats.length;i++){
      if(String(seats[i]).trim() === seat){
        rowIndex = FIRST_ROW + i;
        break;
      }
    }

    if(rowIndex === -1){
      return {
        success:false,
        error:"لم يتم العثور على الطالبة"
      };
    }

    // حذف بيانات الطالبة فقط من A:F بدون حذف الصف بالكامل حتى لا تتأثر بيانات المعلمين أو الجلسات
    sheet.getRange(rowIndex,1,1,6).clearContent();

    return {
      success:true,
      message:"تم حذف الطالبة"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getStudentMonthlyAbsence(data){

  const sheet = SpreadsheetApp.getActive().getSheetByName("Sheet1");

  const START_ROW = 8;
  const HEADER_ROW = 7;
  const START_COL = 5;

  const keyword = String(data.keyword || "").trim().toLowerCase();
  const month = String(data.month || "").trim();

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers = sheet
    .getRange(HEADER_ROW,START_COL,1,lastCol-START_COL+1)
    .getDisplayValues()[0];

  const rows = sheet
    .getRange(START_ROW,1,lastRow-START_ROW+1,lastCol)
    .getDisplayValues();

  const result = [];

  for(let i=0;i<rows.length;i++){

    const row = rows[i];

    const seat = String(row[0]).trim();
    const name = String(row[1]).trim();
    const className = String(row[2]).trim();

    if(
      !seat.includes(keyword) &&
      !name.toLowerCase().includes(keyword)
    ){
      continue;
    }

    const days = {};
    let total = 0;

    for(let c=0;c<headers.length;c++){

      const header = String(headers[c]).trim();

      if(!header.includes(month)){
        continue;
      }

      const value = String(row[START_COL - 1 + c]).trim();

      if(value === "غ"){

        const dateOnly = header.split(" - ")[0];

        if(!days[dateOnly]){
          days[dateOnly] = 0;
          total++;
        }

        days[dateOnly]++;

      }

    }

    result.push({
      seat:seat,
      name:name,
      className:className,
      totalAbsence:total,
      details:Object.keys(days).map(d=>({
        date:d,
        sessions:days[d]
      }))
    });

  }

  return result;

}
function getTeachersStats(){

  const ss = SpreadsheetApp.getActive();

  const dataSheet =
    ss.getSheetByName("بيانات");

  const absenceSheet =
    ss.getSheetByName("Sheet1");

  const FIRST_ROW = 8;

  const today =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

  const teachersValues =
    dataSheet
      .getRange(
        FIRST_ROW,
        7,
        dataSheet.getLastRow() - FIRST_ROW + 1,
        1
      )
      .getDisplayValues()
      .flat();

  const teachers =
    [...new Set(
      teachersValues
        .map(t => String(t || "").trim())
        .filter(Boolean)
    )];

  const stats = {};

  teachers.forEach(t=>{
    stats[t] = {
      name:t,
      totalSessions:0,
      sessions:[]
    };
  });

  const comments =
    absenceSheet
      .getDataRange()
      .getComments();

  for(let r=0;r<comments.length;r++){

    for(let c=0;c<comments[r].length;c++){

      const comment =
        String(comments[r][c] || "");

      if(!comment){
        continue;
      }

      /*
       * مهم:
       * يتم عرض جلسات تاريخ اليوم فقط.
       * تعليق الخلية عند الحفظ يكون بهذا الشكل:
       * المعلم: ...
       * التاريخ: yyyy-MM-dd
       * الجلسة: ...
       */
      if(comment.indexOf("التاريخ: " + today) === -1){
        continue;
      }

      for(const teacher of teachers){

        if(comment.includes(teacher)){

          let sessionName =
            "جلسة غير محددة";

          const sessionMatch =
            comment.match(/الجلسة:\s*(.*)/);

          if(sessionMatch && sessionMatch[1]){
            sessionName =
              sessionMatch[1].trim();
          }

          if(
            stats[teacher].sessions.indexOf(sessionName) === -1
          ){
            stats[teacher].sessions.push(sessionName);
          }

        }

      }

    }

  }

  for(const teacher in stats){

    stats[teacher].totalSessions =
      stats[teacher].sessions.length;

  }

  return Object.values(stats);

}

function addTeacher(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("بيانات");

    const FIRST_ROW = 8;
    const TEACHER_COL = 7;

    const teacherName =
      String(data.name || "").trim();

    if(!teacherName){
      return {
        success:false,
        error:"اسم المعلم مطلوب"
      };
    }

    const lastRow = sheet.getLastRow();

    const values =
      sheet
      .getRange(
        FIRST_ROW,
        TEACHER_COL,
        lastRow - FIRST_ROW + 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(x=>String(x || "").trim());

    if(values.includes(teacherName)){
      return {
        success:false,
        error:"المعلم موجود بالفعل"
      };
    }

    let targetRow = lastRow + 1;

    for(let i=0;i<values.length;i++){
      if(values[i] === ""){
        targetRow = FIRST_ROW + i;
        break;
      }
    }

    sheet
      .getRange(targetRow,TEACHER_COL)
      .setValue(teacherName);

    return {
      success:true,
      message:"تم إضافة المعلم"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}

function deleteTeacher(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("بيانات");

    const FIRST_ROW = 8;
    const TEACHER_COL = 7;

    const teacherName =
      String(data.name || "").trim();

    if(!teacherName){
      return {
        success:false,
        error:"اسم المعلم مطلوب"
      };
    }

    const lastRow = sheet.getLastRow();

    const values =
      sheet
      .getRange(
        FIRST_ROW,
        TEACHER_COL,
        lastRow - FIRST_ROW + 1,
        1
      )
      .getDisplayValues()
      .flat();

    for(let i=0;i<values.length;i++){

      if(String(values[i] || "").trim() === teacherName){

        sheet
          .getRange(FIRST_ROW + i,TEACHER_COL)
          .clearContent();

        return {
          success:true,
          message:"تم حذف المعلم"
        };

      }

    }

    return {
      success:false,
      error:"لم يتم العثور على المعلم"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getDailyReport(data){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName("Sheet1");

  const START_ROW = 8;
  const HEADER_ROW = 7;
  const START_COL = 5;

  const selectedDate =
    String(data.date || "").trim();

  const selectedClass =
    String(data.className || "all").trim();

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers =
    sheet
    .getRange(
      HEADER_ROW,
      START_COL,
      1,
      lastCol - START_COL + 1
    )
    .getDisplayValues()[0];

  const rows =
    sheet
    .getRange(
      START_ROW,
      1,
      lastRow - START_ROW + 1,
      lastCol
    )
    .getDisplayValues();

  function normalizeDate(value){

    value = String(value || "").trim();

    if(value.indexOf(" - ") !== -1){
      value = value.split(" - ")[0].trim();
    }

    if(value.indexOf("/") !== -1){

      const p = value.split("/");

      if(p.length === 3){
        return p[2] + "-" + p[1].padStart(2,"0") + "-" + p[0].padStart(2,"0");
      }

    }

    if(value.indexOf("-") !== -1){

      const p = value.split("-");

      if(p.length >= 3){
        return p[0] + "-" + p[1].padStart(2,"0") + "-" + p[2].substring(0,2).padStart(2,"0");
      }

    }

    return value;

  }

  const targetDate =
    normalizeDate(selectedDate);

  const result = [];

  for(let i=0;i<rows.length;i++){

    const row = rows[i];

    const seat = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    const className = String(row[2] || "").trim();

    if(!seat || !name){
      continue;
    }

    if(
      selectedClass !== "all" &&
      className !== selectedClass
    ){
      continue;
    }

    let hasAbsence = false;
    const sessions = [];

    for(let c=0;c<headers.length;c++){

      const headerDate =
        normalizeDate(headers[c]);

      if(headerDate !== targetDate){
        continue;
      }

      const value =
        String(row[START_COL - 1 + c] || "")
        .replace(/\s/g,"")
        .trim();

      if(value.includes("غ")){

        hasAbsence = true;
        sessions.push(headers[c]);

      }

    }

    if(hasAbsence){

      result.push({
        seat:seat,
        name:name,
        className:className,
        status:"غائب",
        date:targetDate,
        sessions:sessions
      });

    }

  }

  return result;

}

function getMonthlyReport(data){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName("حصر الغياب");

  const START_ROW = 8;
  const HEADER_ROW = 7;
  const START_COL = 5;

  const month =
    String(data.month || "")
    .trim()
    .padStart(2,"0");

  const selectedClass =
    String(data.className || "all").trim();

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers =
    sheet
    .getRange(
      HEADER_ROW,
      START_COL,
      1,
      lastCol - START_COL + 1
    )
    .getDisplayValues()[0];

  const rows =
    sheet
    .getRange(
      START_ROW,
      1,
      lastRow - START_ROW + 1,
      lastCol
    )
    .getDisplayValues();

  function getHeaderDate(header){

    header = String(header || "").trim();

    if(!header){
      return "";
    }

    if(header.indexOf(" - ") !== -1){
      header = header.split(" - ")[0].trim();
    }

    let match1 = header.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    let match2 = header.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if(match1){
      return (
        match1[1] + "-" +
        String(match1[2]).padStart(2,"0") + "-" +
        String(match1[3]).padStart(2,"0")
      );
    }

    if(match2){
      return (
        match2[3] + "-" +
        String(match2[2]).padStart(2,"0") + "-" +
        String(match2[1]).padStart(2,"0")
      );
    }

    return "";

  }

  const result = [];

  for(let i=0;i<rows.length;i++){

    const row = rows[i];

    const seat = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    const className = String(row[2] || "").trim();

    if(!seat || !name){
      continue;
    }

    if(
      selectedClass !== "all" &&
      className !== selectedClass
    ){
      continue;
    }

    const absenceDays = {};

    for(let c=0;c<headers.length;c++){

      const header =
        String(headers[c] || "").trim();

      const dateOnly = getHeaderDate(header);

      if(!dateOnly){
        continue;
      }

      const headerMonth =
        dateOnly.split("-")[1];

      if(headerMonth !== month){
        continue;
      }

      const value =
        String(row[START_COL - 1 + c] || "")
        .trim();

      if(value === "غ" || value.includes("غ")){

        if(!absenceDays[dateOnly]){
          absenceDays[dateOnly] = {
            date:dateOnly,
            sessions:0,
            headers:[]
          };
        }

        absenceDays[dateOnly].sessions++;
        absenceDays[dateOnly].headers.push(header);

      }

    }

    const days =
      Object.keys(absenceDays)
      .sort()
      .map(d=>absenceDays[d]);

    if(days.length > 0){

      result.push({
        seat:seat,
        name:name,
        className:className,
        totalAbsence:days.length,
        dates:days.map(d=>d.date),
        details:days
      });

    }

  }

  return result;

}
function getAbsenceClasses(){

  const sheet =
    SpreadsheetApp
    .getActive()
    .getSheetByName("حصر الغياب");

  const START_ROW = 8;

  const lastRow =
    sheet.getLastRow();

  const values =
    sheet
    .getRange(
      START_ROW,
      3,
      lastRow - START_ROW + 1,
      1
    )
    .getDisplayValues()
    .flat();

  return [
    ...new Set(
      values
        .map(x => String(x || "").trim())
        .filter(Boolean)
    )
  ];

}
function getUsers(){

  const sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  const values = sheet.getDataRange().getDisplayValues();
  const result = [];

  for(let i=1;i<values.length;i++){
    if(values[i][0]){
      result.push({
        username:values[i][0],
        password:values[i][1],
        role:values[i][2]
      });
    }
  }

  return result;
}

function addUser(data){

  const sheet = SpreadsheetApp.getActive().getSheetByName("Users");

  const username = String(data.username || "").trim();
  const password = String(data.password || "").trim();
  const role = String(data.role || "").trim();

  if(!username || !password || !role){
    return {success:false,error:"كل البيانات مطلوبة"};
  }

  const values = sheet.getDataRange().getDisplayValues();

  for(let i=1;i<values.length;i++){
    if(String(values[i][0]).trim() === username){
      return {success:false,error:"المستخدم موجود بالفعل"};
    }
  }

  sheet.appendRow([username,password,role]);

  return {success:true,message:"تم إضافة المستخدم"};
}

function updateUser(data){

  const sheet = SpreadsheetApp.getActive().getSheetByName("Users");

  const oldUsername = String(data.oldUsername || "").trim();
  const username = String(data.username || "").trim();
  const password = String(data.password || "").trim();
  const role = String(data.role || "").trim();

  const values = sheet.getDataRange().getDisplayValues();

  for(let i=1;i<values.length;i++){

    if(String(values[i][0]).trim() === oldUsername){

      sheet.getRange(i+1,1,1,3).setValues([[
        username,
        password,
        role
      ]]);

      return {success:true,message:"تم تعديل المستخدم"};
    }
  }

  return {success:false,error:"لم يتم العثور على المستخدم"};
}

function deleteUser(data){

  const sheet = SpreadsheetApp.getActive().getSheetByName("Users");

  const username = String(data.username || "").trim();
  const values = sheet.getDataRange().getDisplayValues();

  for(let i=1;i<values.length;i++){

    if(String(values[i][0]).trim() === username){
      sheet.deleteRow(i+1);
      return {success:true,message:"تم حذف المستخدم"};
    }
  }

  return {success:false,error:"لم يتم العثور على المستخدم"};
}
function addStudent(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("بيانات");

    const FIRST_ROW = 8;

    const seat =
      String(data.seat || "").trim();

    const name =
      String(data.name || "").trim();

    const className =
      String(data.className || "").trim();

    const code =
      String(data.code || "").trim();

    const lang =
      String(data.lang || "").trim();

    const section =
      String(data.section || "").trim();

    if(!seat || !name || !className){
      return {
        success:false,
        error:"رقم الجلوس والاسم والفصل مطلوبة"
      };
    }

    const lastRow =
      sheet.getLastRow();

    const seats =
      sheet
      .getRange(
        FIRST_ROW,
        1,
        lastRow - FIRST_ROW + 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(x=>String(x || "").trim());

    if(seats.includes(seat)){
      return {
        success:false,
        error:"رقم الجلوس موجود بالفعل"
      };
    }

    let targetRow =
      lastRow + 1;

    for(let i=0;i<seats.length;i++){
      if(seats[i] === ""){
        targetRow = FIRST_ROW + i;
        break;
      }
    }

    sheet
      .getRange(targetRow,1,1,6)
      .setValues([[
        seat,
        name,
        className,
        code,
        lang,
        section
      ]]);

    return {
      success:true,
      message:"تم إضافة الطالبة"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getBackupData(){

  const ss = SpreadsheetApp.getActive();

  function readSheet(name){

    const sheet = ss.getSheetByName(name);

    if(!sheet){
      return [];
    }

    return sheet.getDataRange().getDisplayValues();

  }

  return {
    students:readSheet("بيانات"),
    absence:readSheet("حصر الغياب"),
    users:readSheet("Users"),
    sheet1:readSheet("Sheet1")
  };

}
function getSettings(){

  try{

    const ss = SpreadsheetApp.getActive();

    let sheet = ss.getSheetByName("Settings");

    if(!sheet){
      sheet = ss.insertSheet("Settings");
      sheet.getRange(1,1,1,2).setValues([["key","value"]]);
    }

    const lastRow = sheet.getLastRow();

    if(lastRow < 2){
      return {};
    }

    const values = sheet
      .getRange(2,1,lastRow - 1,2)
      .getDisplayValues();

    const settings = {};

    values.forEach(function(row){

      const key = String(row[0] || "").trim();
      const value = String(row[1] || "").trim();

      if(key){
        settings[key] = value;
      }

    });

    return settings;

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}

function saveSettings(data){

  try{

    const ss =
      SpreadsheetApp.getActiveSpreadsheet();

    // ورقة الإعدادات
    let settingsSheet =
      ss.getSheetByName("Settings");

    if(!settingsSheet){

      settingsSheet =
        ss.insertSheet("Settings");

    }

    const schoolName =
      String(data.schoolName || "").trim();

    const schoolYear =
      String(data.schoolYear || "").trim();

    const term =
      String(data.term || "").trim();

    const startDate =
      String(data.startDate || "").trim();

    // حفظ الإعدادات
    const rows = [
      ["key","value"],
      ["schoolName",schoolName],
      ["schoolYear",schoolYear],
      ["term",term],
      ["startDate",startDate]
    ];

    settingsSheet.clearContents();

    settingsSheet
      .getRange(
        1,
        1,
        rows.length,
        2
      )
      .setValues(rows);


    // =====================================
    // استخراج أول سنة من العام الدراسي
    // =====================================

    const yearMatch =
      schoolYear.match(/\d{4}/);

    if(!yearMatch){

      throw new Error(
        "لم يتم العثور على سنة صحيحة في العام الدراسي: " +
        schoolYear
      );

    }

    const firstYear =
      yearMatch[0];


    // =====================================
    // البحث عن ورقة حصر الغياب
    // =====================================

    const allSheets =
      ss.getSheets();

    let absenceSheet = null;

    for(
      let i = 0;
      i < allSheets.length;
      i++
    ){

      const currentName =
        String(
          allSheets[i].getName()
        )
        .replace(/\s+/g," ")
        .trim();

      if(
        currentName ===
        "حصر الغياب"
      ){

        absenceSheet =
          allSheets[i];

        break;

      }

    }


    if(!absenceSheet){

      const sheetNames =
        allSheets
          .map(
            sheet =>
              "[" +
              sheet.getName() +
              "]"
          )
          .join("، ");

      throw new Error(
        "لم يتم العثور على ورقة حصر الغياب. " +
        "الأوراق الموجودة هي: " +
        sheetNames
      );

    }


    // =====================================
    // تحديث الخلية A3
    // =====================================

    absenceSheet
      .getRange("A3")
      .setValue(firstYear);

    SpreadsheetApp.flush();


    // قراءة القيمة للتأكد
    const savedYear =
      String(
        absenceSheet
          .getRange("A3")
          .getDisplayValue()
      )
      .trim();


    return {

      success:true,

      message:
        "تم حفظ الإعدادات وتحديث A3 إلى " +
        savedYear,

      updatedYear:
        savedYear

    };

  }catch(error){

    console.error(
      "saveSettings error:",
      error
    );

    return {

      success:false,

      error:
        error.toString()

    };

  }

}
function getActiveSession(){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("بيانات");

    const values =
      sheet
      .getRange("I7:O8")
      .getDisplayValues();

    const sessions = values[0];
    const times = values[1];

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    function parseSingleTime(text){

      text =
        String(text || "")
        .trim()
        .replace("ص","AM")
        .replace("م","PM");

      const match =
        text.match(/(\d{1,2})\s*:\s*(\d{1,2})/);

      if(!match){
        return null;
      }

      let h = Number(match[1]);
      const m = Number(match[2]);

      /*
        لأن الجدول عندك صباحي/ظهري بدون AM/PM:
        7:45 = صباحًا
        1:35 = بعد الظهر
      */
      if(h >= 1 && h <= 6){
        h += 12;
      }

      return h * 60 + m;

    }

    function parseRange(text){

      const parts =
        String(text || "")
        .split("-");

      if(parts.length < 2){
        return null;
      }

      const start =
        parseSingleTime(parts[0]);

      const end =
        parseSingleTime(parts[1]);

      if(start === null || end === null){
        return null;
      }

      return {
        start:start,
        end:end
      };

    }

    for(let i=0;i<sessions.length;i++){

      const sessionName =
        String(sessions[i] || "").trim();

      const timeText =
        String(times[i] || "").trim();

      const range =
        parseRange(timeText);

      if(!sessionName || !range){
        continue;
      }

      if(
        currentMinutes >= range.start &&
        currentMinutes < range.end
      ){

        return {
          success:true,
          session:{
            id:i + 1,
            name:sessionName,
            time:timeText
          }
        };

      }

    }

    return {
      success:false,
      error:
        "لا توجد Session نشطة الآن - الوقت الحالي: " +
        Utilities.formatDate(
          now,
          Session.getScriptTimeZone(),
          "hh:mm a"
        )
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getTodayAbsenceSummaryV2(){

  try{

    const sheet = SpreadsheetApp.getActive().getSheetByName("Sheet1");

    const START_ROW = 8;
    const HEADER_ROW = 7;
    const START_COL = 5; // E

    const today = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers = sheet
      .getRange(HEADER_ROW,START_COL,1,lastCol - START_COL + 1)
      .getDisplayValues()[0];

    const rows = sheet
      .getRange(START_ROW,1,lastRow - START_ROW + 1,lastCol)
      .getDisplayValues();

    const todayCols = [];

    for(let c=0;c<headers.length;c++){

      const header = String(headers[c] || "").trim();

      if(header.indexOf(today) !== -1){
        todayCols.push(c);
      }

    }

    const summary = {};
    const countedAbsentStudents = {};

    for(let r=0;r<rows.length;r++){

      const row = rows[r];

      const seat = String(row[0] || "").trim();
      const className = String(row[2] || "").trim();

      if(!seat || !className){
        continue;
      }

      let hasAbsence = false;

      for(let i=0;i<todayCols.length;i++){

        const c = todayCols[i];

        const value = String(row[START_COL - 1 + c] || "")
          .replace(/\s/g,"")
          .trim();

        if(value.indexOf("غ") !== -1){
          hasAbsence = true;
          break;
        }

      }

      if(hasAbsence){

        const uniqueKey =
          className + "_" + seat + "_" + today;

        if(!countedAbsentStudents[uniqueKey]){

          countedAbsentStudents[uniqueKey] = true;

          summary[className] =
            (summary[className] || 0) + 1;

        }

      }

    }

    return Object.keys(summary).map(function(cls){
      return {
        className:cls,
        count:summary[cls]
      };
    });

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function debugTodayAbsenceSummary(){

  const result = getTodayAbsenceSummaryV2();

  Logger.log(JSON.stringify(result));

  const sheet = SpreadsheetApp.getActive().getSheetByName("Sheet1");

  const headers =
    sheet.getRange("E7:K7").getDisplayValues()[0];

  const rows =
    sheet.getRange("A8:K15").getDisplayValues();

  Logger.log("HEADERS: " + JSON.stringify(headers));
  Logger.log("ROWS: " + JSON.stringify(rows));

}
function getDashboardLiveData(){

  try{

    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Sheet1");

    const START_ROW = 8;
    const HEADER_ROW = 7;
    const START_COL = 5;

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers =
      sheet.getRange(
        HEADER_ROW,
        START_COL,
        1,
        lastCol - START_COL + 1
      ).getDisplayValues()[0];

    const rows =
      sheet.getRange(
        START_ROW,
        1,
        lastRow - START_ROW + 1,
        lastCol
      ).getDisplayValues();

    const todayCols = [];

    headers.forEach((h,index)=>{
      const header = String(h || "").trim();
      if(header.includes(today)){
        todayCols.push(index);
      }
    });

    const allClassesSet = {};
    const registeredSet = {};
    const absenceMap = {};
    const countedAbsentStudents = {};

    rows.forEach(row=>{

      const seat = String(row[0] || "").trim();
      const className = String(row[2] || "").trim();

      if(!seat || !className){
        return;
      }

      allClassesSet[className] = true;

      let rowRegistered = false;
      let rowAbsent = false;

      todayCols.forEach(c=>{

        const value =
          String(row[START_COL - 1 + c] || "")
          .replace(/\s/g,"")
          .trim();

        if(value.includes("ح") || value.includes("غ") || value.includes("مرضي")){
          rowRegistered = true;
        }

        if(value.includes("غ")){
          rowAbsent = true;
        }

      });

      if(rowRegistered){
        registeredSet[className] = true;
      }

      if(rowAbsent){

        const uniqueKey =
          className + "_" + seat + "_" + today;

        if(!countedAbsentStudents[uniqueKey]){

          countedAbsentStudents[uniqueKey] = true;

          absenceMap[className] =
            (absenceMap[className] || 0) + 1;

        }

      }

    });

    const allClasses =
      Object.keys(allClassesSet).sort();

    const registeredClasses =
      Object.keys(registeredSet).sort();

    const notRegistered =
      allClasses
        .filter(cls=>!registeredSet[cls])
        .sort();

    const summary =
      Object.keys(absenceMap)
        .sort()
        .map(cls=>({
          className:cls,
          count:absenceMap[cls]
        }));

    let totalAbsence = 0;
    let topClass = "-";
    let topCount = 0;
    let minClass = "-";
    let minCount = null;

    summary.forEach(item=>{

      const count = Number(item.count || 0);

      totalAbsence += count;

      if(count > topCount){
        topClass = item.className;
        topCount = count;
      }

      if(minCount === null || count < minCount){
        minClass = item.className;
        minCount = count;
      }

    });

    const chartData =
      allClasses.map(cls=>({
        className:cls,
        absence:absenceMap[cls] || 0
      }));

    const active = getActiveSession();

    return {
      success:true,
      totalAbsence:totalAbsence,
      topClass:topClass,
      topCount:topCount,
      minClass:minClass,
      minCount:minCount === null ? 0 : minCount,
      allClasses:allClasses,
      registeredClasses:registeredClasses,
      notRegistered:notRegistered,
      summary:summary,
      chartData:chartData,
      activeSession:active && active.success ? active.session : null
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getMonitorData(){

  try{

    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Sheet1");

    const START_ROW = 8;
    const HEADER_ROW = 7;
    const START_COL = 5;

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    const active =
      getActiveSession();

    const activeSession =
      active && active.success
        ? active.session
        : null;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers = lastCol >= START_COL
      ? sheet.getRange(HEADER_ROW, START_COL, 1, lastCol - START_COL + 1).getDisplayValues()[0]
      : [];

    const rows = lastRow >= START_ROW && lastCol >= 3
      ? sheet.getRange(START_ROW, 1, lastRow - START_ROW + 1, lastCol).getDisplayValues()
      : [];

    const todayCols = [];

    headers.forEach((h,index)=>{

      const header = String(h || "").trim();

      if(header.includes(today)){
        todayCols.push({
          index:index,
          header:header
        });
      }

    });

    const classMap = {};

    rows.forEach(row=>{

      const className = String(row[2] || "").trim();

      if(!className){
        return;
      }

      if(!classMap[className]){
        classMap[className] = {
          className:className,
          registered:false,
          absentCount:0,
          presentCount:0,
          lastSession:"",
          lastColumn:"",
          alertText:""
        };
      }

      let rowAbsent = false;
      let rowPresent = false;

      todayCols.forEach(col=>{

        const value =
          String(row[START_COL - 1 + col.index] || "")
          .replace(/\s/g,"")
          .trim();

        if(value.includes("ح") || value.includes("غ") || value.includes("مرضي")){

          classMap[className].registered = true;
          classMap[className].lastColumn = col.header;

          const parts = col.header.split(" - ");

          classMap[className].lastSession =
            parts.length > 1 ? parts[1] : col.header;

        }

        if(value.includes("غ")){
          rowAbsent = true;
        }

        if(value.includes("ح")){
          rowPresent = true;
        }

      });

      if(rowAbsent){
        classMap[className].absentCount++;
      }

      if(rowPresent && !rowAbsent){
        classMap[className].presentCount++;
      }

    });

    const result =
      Object.keys(classMap)
      .sort()
      .map(cls=>{

        const item = classMap[cls];

        item.alertText =
          "تنبيه: برجاء تسجيل غياب فصل " +
          item.className +
          (
            activeSession
              ? " في " + activeSession.name
              : ""
          );

        return item;

      });

    return {
      success:true,
      date:today,
      activeSession:activeSession,
      rows:result,
      registered:result.filter(x=>x.registered),
      notRegistered:result.filter(x=>!x.registered)
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getParentPhones(){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("حصر الغياب");

    const START_ROW = 8;

    const SEAT_COL = 1;   // A
    const PHONE_COL = 296; // KJ

    const lastRow = sheet.getLastRow();

    const seats =
      sheet
      .getRange(
        START_ROW,
        SEAT_COL,
        lastRow - START_ROW + 1,
        1
      )
      .getDisplayValues();

    const phones =
      sheet
      .getRange(
        START_ROW,
        PHONE_COL,
        lastRow - START_ROW + 1,
        1
      )
      .getDisplayValues();

    const result = {};

    for(let i=0;i<seats.length;i++){

      const seat =
        String(seats[i][0] || "")
        .trim();

      const phone =
        String(phones[i][0] || "")
        .replace(/\s/g,"")
        .replace(/-/g,"")
        .trim();

      if(seat && phone){

        result[seat] = phone;

      }

    }

    return {
      success:true,
      phones:result
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getStudentMonthAttendanceEdit(data){

  try{

    const seat = String(data.seat || "").trim();
    const month = String(data.month || "").padStart(2,"0");
    const year = String(data.year || new Date().getFullYear());

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("حصر الغياب");

    const HEADER_ROW = 7;
    const START_ROW = 8;
    const SEAT_COL = 1;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers =
      sheet.getRange(HEADER_ROW,1,1,lastCol).getDisplayValues()[0];

    const rowSeats =
      sheet.getRange(START_ROW,SEAT_COL,lastRow - START_ROW + 1,1).getDisplayValues();

    let targetRow = -1;

    for(let i=0;i<rowSeats.length;i++){
      if(String(rowSeats[i][0] || "").trim() === seat){
        targetRow = START_ROW + i;
        break;
      }
    }

    if(targetRow === -1){
      return {
        success:false,
        error:"لم يتم العثور على رقم الجلوس: " + seat
      };
    }

    const rowValues =
      sheet.getRange(targetRow,1,1,lastCol).getDisplayValues()[0];

    const records = [];

    let currentHeader = "";

    headers.forEach((h,index)=>{

      let header = String(h || "").trim();

      // للتعامل مع الخلايا المدمجة أو الأعمدة الفارغة التابعة لنفس اليوم
      if(header){
        currentHeader = header;
      }else{
        header = currentHeader;
      }

      if(!header){
        return;
      }

      let foundYear = "";
      let foundMonth = "";
      let foundDay = "";

      // 2026-05-11
      let match1 = header.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);

      // 11/05/2026
      let match2 = header.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

      if(match1){
        foundYear = match1[1];
        foundMonth = String(match1[2]).padStart(2,"0");
        foundDay = String(match1[3]).padStart(2,"0");
      }else if(match2){
        foundYear = match2[3];
        foundMonth = String(match2[2]).padStart(2,"0");
        foundDay = String(match2[1]).padStart(2,"0");
      }else{
        return;
      }

      if(foundYear !== year || foundMonth !== month){
        return;
      }

      records.push({
        rowIndex:targetRow,
        colIndex:index + 1,
        date:foundYear + "-" + foundMonth + "-" + foundDay,
        sessionName:header.includes(" - ")
          ? header.split(" - ")[1]
          : "",
        status:String(rowValues[index] || "").trim()
      });

    });

    return {
      success:true,
      records:records,
      debug:{
        seat:seat,
        month:month,
        year:year,
        foundRecords:records.length
      }
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}


function updateStudentMonthAttendance(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("حصر الغياب");

    if(!sheet){
      return {
        success:false,
        error:"لم يتم العثور على صفحة حصر الغياب"
      };
    }

    const auditSheet =
      getAuditSheet();

    const records =
      Array.isArray(data.records)
        ? data.records
        : [];

    const userName =
      data.userName || "غير معروف";

    const studentName =
      data.studentName || "";

    records.forEach(item=>{

      const rowIndex =
        Number(item.rowIndex);

      const colIndex =
        Number(item.colIndex);

      const oldStatus =
        String(
          sheet
          .getRange(rowIndex,colIndex)
          .getDisplayValue() || ""
        ).trim();

      const newStatus =
        String(item.status || "").trim();

      if(oldStatus !== newStatus){

        sheet
          .getRange(rowIndex,colIndex)
          .setValue(newStatus);

        auditSheet.appendRow([
          new Date(),
          userName,
          item.seat || "",
          studentName,
          item.date || "",
          item.sessionName || "",
          oldStatus,
          newStatus,
          "تعديل غياب شهري من صفحة الطلاب"
        ]);

      }

    });

    return {
      success:true,
      message:"تم حفظ التعديلات وتسجيلها في سجل التعديلات"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getSiteStatus(){

  try{

    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName("Settings");

    if(!sheet){
      sheet = ss.insertSheet("Settings");
    }

    const manualClosed =
      String(sheet.getRange("B10").getValue() || "false") === "true";

    const manualMessage =
      String(sheet.getRange("B11").getValue() || "الموقع مغلق الآن للصيانة");

    const weekendData =
      getWeekendSettings();

    const weekends =
      weekendData && weekendData.success && Array.isArray(weekendData.weekends)
        ? weekendData.weekends
        : [];

    const todayName =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "EEEE"
      );

    const isWeekend =
      weekends.includes(todayName);

    const message =
      isWeekend
        ? "الموقع متوقف اليوم بسبب العطلة الأسبوعية"
        : manualMessage;

    return {
      success:true,
      isClosed:manualClosed || isWeekend,
      manualClosed:manualClosed,
      isWeekend:isWeekend,
      todayName:todayName,
      weekends:weekends,
      message:message
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}


function saveSiteStatus(data){

  try{

    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName("Settings");

    if(!sheet){
      sheet = ss.insertSheet("Settings");
    }

    sheet.getRange("A10").setValue("siteClosed");
    sheet.getRange("B10").setValue(data.isClosed ? "true" : "false");

    sheet.getRange("A11").setValue("closedMessage");
    sheet.getRange("B11").setValue(data.message || "الموقع مغلق الآن للصيانة");

    return {
      success:true,
      message:"تم حفظ حالة الموقع"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}

function getWeekendSettings(){

  try{

    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName("Settings");

    if(!sheet){
      sheet = ss.insertSheet("Settings");
    }

    const raw =
      String(sheet.getRange("B12").getValue() || "[]");

    let weekends = [];

    try{
      weekends = JSON.parse(raw);
    }catch(e){
      weekends = [];
    }

    if(!Array.isArray(weekends)){
      weekends = [];
    }

    return {
      success:true,
      weekends:weekends
    };

  }catch(error){

    return {
      success:false,
      weekends:[],
      error:error.toString()
    };

  }

}


function saveWeekendSettings(data){

  try{

    const ss = SpreadsheetApp.getActive();
    let sheet = ss.getSheetByName("Settings");

    if(!sheet){
      sheet = ss.insertSheet("Settings");
    }

    const weekends =
      Array.isArray(data.weekends)
        ? data.weekends
        : [];

    sheet.getRange("A12").setValue("weekendDays");
    sheet.getRange("B12").setValue(JSON.stringify(weekends));

    return {
      success:true,
      message:"تم حفظ أيام العطلات"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}


function getAuditSheet(){

  const ss = SpreadsheetApp.getActive();

  let sheet =
    ss.getSheetByName("سجل التعديلات");

  if(!sheet){

    sheet = ss.insertSheet("سجل التعديلات");

    sheet.appendRow([
      "وقت التعديل",
      "المستخدم",
      "رقم الجلوس",
      "اسم الطالبة",
      "التاريخ",
      "Session",
      "الحالة القديمة",
      "الحالة الجديدة",
      "ملاحظات"
    ]);

  }

  return sheet;

}
function getAuditLog(){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("سجل التعديلات");

    if(!sheet){
      return {
        success:true,
        records:[]
      };
    }

    const values = sheet.getDataRange().getDisplayValues();
    const rows = values.slice(1).reverse();

    const records = rows.map((r,index)=>({
      id:index,
      time:r[0],
      user:r[1],
      seat:r[2],
      studentName:r[3],
      date:r[4],
      session:r[5],
      oldStatus:r[6],
      newStatus:r[7],
      notes:r[8]
    }));

    return {
      success:true,
      records:records
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function clearAuditLog(data){

  try{

    const password =
      String(data.password || "").trim();

    if(password !== "111"){

      return {
        success:false,
        error:"الرقم السري غير صحيح"
      };

    }

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("سجل التعديلات");

    if(!sheet){

      return {
        success:false,
        error:"لم يتم العثور على صفحة سجل التعديلات"
      };

    }

    const lastRow =
      sheet.getLastRow();

    if(lastRow > 1){

      sheet.deleteRows(
        2,
        lastRow - 1
      );

    }

    return {
      success:true,
      message:"تم تفريغ سجل التعديلات"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getClassTodaySessionAttendanceEdit(data){

  try{

    const className =
      String(data.className || "").trim();

    if(!className){
      return {
        success:false,
        error:"لم يتم إرسال اسم الفصل"
      };
    }

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("Sheet1");

    if(!sheet){
      return {
        success:false,
        error:"لم يتم العثور على صفحة Sheet1"
      };
    }

    const HEADER_ROW = 7;
    const START_ROW = 8;

    const SEAT_COL = 1;
    const NAME_COL = 2;
    const CLASS_COL = 3;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    const headers =
      sheet
      .getRange(HEADER_ROW,1,1,lastCol)
      .getDisplayValues()[0];

    const values =
      sheet
      .getRange(
        START_ROW,
        1,
        lastRow - START_ROW + 1,
        lastCol
      )
      .getDisplayValues();

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    const sessionColumns = [];

    let currentHeader = "";

    headers.forEach((h,index)=>{

      let header =
        String(h || "").trim();

      if(header){
        currentHeader = header;
      }else{
        header = currentHeader;
      }

      if(!header){
        return;
      }

      if(header.indexOf(today) === -1){
        return;
      }

      sessionColumns.push({
        colIndex:index + 1,
        header:header,
        sessionName:header.includes(" - ")
          ? header.split(" - ")[1]
          : header
      });

    });

    const students = [];

    values.forEach((row,rowIndex)=>{

      const rowClass =
        String(row[CLASS_COL - 1] || "").trim();

      if(rowClass !== className){
        return;
      }

      const seat =
        String(row[SEAT_COL - 1] || "").trim();

      const name =
        String(row[NAME_COL - 1] || "").trim();

      if(!seat || !name){
        return;
      }

      const sessions =
        sessionColumns.map((s)=>({
          rowIndex:START_ROW + rowIndex,
          colIndex:s.colIndex,
          sessionName:s.sessionName,
          status:String(row[s.colIndex - 1] || "").trim()
        }));

      students.push({
        id:students.length,
        seat:seat,
        name:name,
        className:rowClass,
        sessions:sessions
      });

    });

    return {
      success:true,
      today:today,
      sessionColumns:sessionColumns,
      students:students
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}


function updateClassSessionAttendanceEdit(data){

  try{

    const sheet =
      SpreadsheetApp
      .getActive()
      .getSheetByName("Sheet1");

    if(!sheet){
      return {
        success:false,
        error:"لم يتم العثور على صفحة Sheet1"
      };
    }

    const auditSheet =
      getAuditSheet();

    const records =
      Array.isArray(data.records)
        ? data.records
        : [];

    const userName =
      data.userName || "غير معروف";

    records.forEach((item)=>{

      const rowIndex =
        Number(item.rowIndex);

      const colIndex =
        Number(item.colIndex);

      const oldStatus =
        String(
          sheet
          .getRange(rowIndex,colIndex)
          .getDisplayValue() || ""
        ).trim();

      const newStatus =
        String(item.status || "").trim();

      if(oldStatus !== newStatus){

        sheet
          .getRange(rowIndex,colIndex)
          .setValue(newStatus);

        auditSheet.appendRow([
          new Date(),
          userName,
          item.seat || "",
          item.studentName || "",
          item.date || "",
          item.sessionName || "",
          oldStatus,
          newStatus,
          "تعديل غياب Session من صفحة تسجيل الغياب"
        ]);

      }

    });

    return {
      success:true,
      message:"تم حفظ تعديلات غياب الـ Sessions"
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function getAttendanceInitData(){

  try{

    return {
      success:true,
      classes:getClasses(),
      teachers:getTeachers(),
      schedule:getSchedule(),
      activeSession:getActiveSession(),
      parentPhones:getParentPhones()
    };

  }catch(error){

    return {
      success:false,
      error:error.toString()
    };

  }

}
function testUpdateSchoolYear(){

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName("حصر الغياب");

  if(!sheet){

    throw new Error(
      "لم يتم العثور على ورقة حصر الغياب"
    );

  }

  sheet
    .getRange("A3")
    .setValue("2026");

  SpreadsheetApp.flush();

  Logger.log(
    "تم تحديث A3 بنجاح إلى: " +
    sheet.getRange("A3").getDisplayValue()
  );

}

/** Edit one student's attendance on a selected date in حصر الغياب. */
function attendanceDateColumns_(sheet, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) throw new Error("تاريخ غير صحيح");
  const headers = sheet.getRange(7, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  let previous = "";
  const columns = [];
  headers.forEach(function(value, i) {
    const raw = String(value || "").trim();
    if (raw) previous = raw;
    const header = raw || previous;
    const iso = header.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    const dmy = header.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const found = iso ? iso[1] + "-" + iso[2].padStart(2,"0") + "-" + iso[3].padStart(2,"0") :
      dmy ? dmy[3] + "-" + dmy[2].padStart(2,"0") + "-" + dmy[1].padStart(2,"0") : "";
    if (found === date && i >= 4) columns.push({colIndex:i+1, sessionName:header.replace(/.*?(?:جلسة|Session)\s*/i,"Session ") || header});
  });
  return columns;
}

function attendanceStudentRow_(sheet, seat, className) {
  const last = sheet.getLastRow();
  if (last < 8) throw new Error("لا توجد بيانات طالبات");
  const rows = sheet.getRange(8,1,last-7,3).getDisplayValues();
  const matches = [];
  rows.forEach(function(row,i) {
    if (String(row[0]).trim() === String(seat).trim() && String(row[2]).trim() === String(className).trim())
      matches.push({rowIndex:i+8,seat:String(row[0]).trim(),name:String(row[1]).trim(),className:String(row[2]).trim()});
  });
  if (matches.length !== 1) throw new Error(matches.length ? "رقم الجلوس مكرر؛ لا يمكن التعديل بأمان" : "لم يتم العثور على الطالبة في الفصل المحدد");
  return matches[0];
}

function getStudentAttendanceByDate(data) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName("حصر الغياب");
    if (!sheet) throw new Error("ورقة حصر الغياب غير موجودة");
    const date = String(data.date || "");
    const student = attendanceStudentRow_(sheet,data.seat,data.className);
    const columns = attendanceDateColumns_(sheet,date);
    if (!columns.length) throw new Error("لا توجد أعمدة غياب مسجلة لهذا التاريخ في حصر الغياب");
    const sessions = columns.map(function(col) {
      return {colIndex:col.colIndex,sessionName:col.sessionName,status:String(sheet.getRange(student.rowIndex,col.colIndex).getDisplayValue() || "").trim()};
    });
    return {success:true,student:student,date:date,sessions:sessions};
  } catch(error) {return {success:false,error:String(error.message || error)};}
}

function saveStudentAttendanceByDate(data) {
  const lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (!lock.tryLock(20000)) return {success:false,error:"هناك تعديل آخر جارٍ؛ حاول مرة أخرى"};
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName("حصر الغياب");
    if (!sheet) throw new Error("ورقة حصر الغياب غير موجودة");
    const date = String(data.date || "");
    const student = attendanceStudentRow_(sheet,data.seat,data.className);
    const columns = attendanceDateColumns_(sheet,date);
    const allowed = {};
    columns.forEach(function(col) {allowed[col.colIndex] = col;});
    const records = Array.isArray(data.records) ? data.records : [];
    if (!records.length) throw new Error("لا توجد تعديلات للحفظ");
    const seen = {};
    const changes = records.map(function(item) {
      const col = Number(item.colIndex);
      const status = String(item.status == null ? "" : item.status).trim();
      if (!allowed[col] || seen[col]) throw new Error("عمود غير صالح أو مكرر للتاريخ المحدد");
      if (!["", "غ", "ح", "مرضي"].includes(status)) throw new Error("حالة غياب غير مسموحة");
      seen[col] = true;
      const cell = sheet.getRange(student.rowIndex,col);
      return {cell:cell,old:String(cell.getDisplayValue() || "").trim(),status:status,session:allowed[col].sessionName};
    });
    const audit = getAuditSheet();
    let count = 0;
    changes.forEach(function(change) {
      if (change.old === change.status) return;
      change.cell.setValue(change.status);
      audit.appendRow([new Date(),String(data.userName || "Admin"),student.seat,student.name,date,change.session,change.old,change.status,"تعديل غياب بتاريخ محدد من صفحة تسجيل الغياب"]);
      count++;
    });
    SpreadsheetApp.flush();
    return {success:true,message:"تم حفظ " + count + " تعديل في حصر الغياب",updated:count};
  } catch(error) {return {success:false,error:String(error.message || error)};}
  finally {lock.releaseLock();}
}


/** Read today's registered absences across all classes, once per student. */
function getAllTodayAbsentStudents() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(ABSENCE_SHEET);
    if (!sheet) throw new Error("ورقة الغياب Sheet1 غير موجودة");
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 8 || lastCol < 5) return {success:true,students:[]};
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const headers = sheet.getRange(7,5,1,lastCol-4).getDisplayValues()[0];
    const columns = [];
    headers.forEach(function(header,index) {
      const text = String(header || "").trim();
      if (text.indexOf(today) !== -1) {
        columns.push({index:index+4,session:text.replace(today,"").replace(/^[\s\-_–—]+/,"").trim() || "جلسة " + (columns.length+1)});
      }
    });
    if (!columns.length) return {success:true,students:[]};
    const rows = sheet.getRange(8,1,lastRow-7,lastCol).getDisplayValues();
    const unique = {};
    rows.forEach(function(row) {
      const seat = String(row[0] || "").trim();
      const name = String(row[1] || "").trim();
      const className = String(row[2] || "").trim();
      if (!seat || !className) return;
      const absentSessions = columns.filter(function(col) {return String(row[col.index] || "").replace(/\s/g,"").indexOf("غ") !== -1;}).map(function(col) {return col.session;});
      if (!absentSessions.length) return;
      const key = className + "|" + seat;
      if (!unique[key]) unique[key] = {seat:seat,name:name,className:className,sessions:[],phone:""};
      absentSessions.forEach(function(session) {if (unique[key].sessions.indexOf(session) === -1) unique[key].sessions.push(session);});
    });
    const phoneResult = getParentPhones();
    const phones = phoneResult && phoneResult.success ? phoneResult.phones : {};
    const students = Object.keys(unique).map(function(key) {
      const student = unique[key];
      student.phone = String(phones[student.seat] || "").trim();
      return student;
    });
    students.sort(function(a,b) {return a.className.localeCompare(b.className) || a.seat.localeCompare(b.seat,undefined,{numeric:true});});
    return {success:true,students:students};
  } catch(error) {
    return {success:false,error:String(error.message || error)};
  }
}


/* aSc Timetables integration: separate sheets; no change to existing student data. */
function ascSheet_(name,headers){
 const ss=SpreadsheetApp.getActive(); let sh=ss.getSheetByName(name);
 if(!sh){sh=ss.insertSheet(name);sh.appendRow(headers);}return sh;
}
function ascGetSettings_(){
 const sh=ascSheet_("ASC_Config",["Key","Value"]);
 const v=sh.getDataRange().getDisplayValues();const config={days:{},periods:{},delay:10};
 v.slice(1).forEach(r=>{if(r[0]==="config"){try{Object.assign(config,JSON.parse(r[1]));}catch(e){}}});
 return {success:true,config:config};
}
function ascSaveSettings_(data){
 const cfg=data.config||{};
 const validDays=[0,1,2,3,4,5,6];const used=[];
 for(let i=1;i<=5;i++){
  const d=cfg.days&&cfg.days[i];
  if(d!==""&&d!==null&&d!==undefined){if(!validDays.includes(Number(d))||used.includes(Number(d)))return {success:false,error:"تعيين الأيام غير صحيح أو مكرر"};used.push(Number(d));}
 }
 for(let i=1;i<=5;i++){
  const n=cfg.periods&&cfg.periods[i];
  if(n!==""&&n!==null&&n!==undefined&&(!Number.isInteger(Number(n))||Number(n)<1||Number(n)>5))return {success:false,error:"رقم Session غير صحيح"};
 }
 const sh=ascSheet_("ASC_Config",["Key","Value"]);
 sh.getRange(2,1,1,2).setValues([["config",JSON.stringify({days:cfg.days||{},periods:cfg.periods||{},delay:10})]]);
 return {success:true};
}
function ascImport_(data){
 const rows=data.records;
 if(!Array.isArray(rows)||!rows.length||rows.length>3000)return {success:false,error:"بيانات الجدول غير صحيحة"};
 const output=[];const seen={};
 rows.forEach(r=>{
  const day=Number(r.daySlot),p=Number(r.period),cl=String(r.className||"").trim(),t=String(r.teacher||"").trim();
  if(day<1||day>5||p<1||p>5||!/^([123][A-D])$/.test(cl)||!t)return;
  const key=[day,p,cl,t].join("|");if(!seen[key]){seen[key]=true;output.push([day,p,cl,t,String(r.raw||"")]);}
 });
 if(!output.length)return {success:false,error:"لا توجد حصص صالحة"};
 const sh=ascSheet_("ASC_Timetable",["DaySlot","Period","Class","Teacher","OriginalCell"]);
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,5).clearContent();sh.getRange(2,1,output.length,5).setValues(output);SpreadsheetApp.flush();}
 finally{lock.releaseLock();}
 return {success:true,count:output.length};
}
function ascGetAlerts_(){
 const cfg=ascGetSettings_().config;
 const ss=SpreadsheetApp.getActive();
 const sh=ss.getSheetByName("ASC_Timetable");
 if(!sh||sh.getLastRow()<2)return {success:true,configured:false,rows:[],message:"استورد جدول aSc أولًا"};
 const now=new Date(),tz=Session.getScriptTimeZone(),today=Utilities.formatDate(now,tz,"yyyy-MM-dd");
 const weekday=Number(Utilities.formatDate(now,tz,"u"))%7;
 const slots=Object.keys(cfg.days||{}).filter(k=>String(cfg.days[k])===String(weekday));
 if(!slots.length)return {success:true,configured:true,rows:[],message:"لم يتم تعيين يوم اليوم في إعدادات الجدول"};
 const data=sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues();
 const sheet=ss.getSheetByName("Sheet1");
 if(!sheet)return {success:false,error:"ورقة Sheet1 غير موجودة"};
 const last=sheet.getLastRow(),classes={};
 if(last>=8)sheet.getRange(8,3,last-7,1).getDisplayValues().forEach(r=>{if(r[0])classes[String(r[0]).trim()]=true;});
 const logs=ss.getSheetByName("ASC_SaveLog"),saved={};
 if(logs&&logs.getLastRow()>1){
   logs.getRange(2,1,logs.getLastRow()-1,6).getValues().forEach(r=>{
     const date=r[0] instanceof Date?Utilities.formatDate(r[0],tz,"yyyy-MM-dd"):String(r[0]||"").trim();
     if(date===today&&Number(r[4])>0)saved[String(r[1]).trim()+"|"+Number(r[2])]=r[3];
   });
 }
 const timingSheet=ss.getSheetByName(DATA_SHEET);
 if(!timingSheet)return {success:false,error:"ورقة بيانات الخاصة بمواعيد الحصص غير موجودة"};
 const timing=timingSheet.getRange("I7:Q8").getDisplayValues(),sessions=[];
 function minutes(text){
   const value=String(text||"").trim();
   const m=value.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
   if(!m)return null;
   let h=Number(m[1]),min=Number(m[2]);
   if(h>23||min>59)return null;
   if(/PM|م|مساء/i.test(value)){if(h<12)h+=12;}
   else if(/AM|ص|صباح/i.test(value)){if(h===12)h=0;}
   else if(h>=1&&h<=6)h+=12;
   return h*60+min;
 }
 timing[0].forEach((name,i)=>{
   const match=String(name||"").match(/Session\s*(\d+)/i);
   if(!match)return;
   const parts=String(timing[1][i]||"").split(/\s*[-–—]\s*/);
   const start=minutes(parts[0]),end=parts.length>1?minutes(parts[1]):null;
   if(start!==null)sessions.push({id:Number(match[1]),start:start,end:end});
 });
 sessions.sort((a,b)=>a.start-b.start);
 // A session cannot remain active after the next session begins, even if its end cell is wrong.
 sessions.forEach((s,i)=>{
   const next=sessions[i+1];
   if(next&&(s.end===null||s.end<=s.start||s.end>next.start))s.end=next.start;
   if(s.end!==null&&s.end<=s.start)s.end=null;
 });
 const current=Number(Utilities.formatDate(now,tz,"H"))*60+Number(Utilities.formatDate(now,tz,"m"));
 const active=sessions.find(s=>current>=s.start&&s.end!==null&&current<s.end);
 const groups={};
 data.forEach(r=>{
   if(!slots.includes(String(r[0])))return;
   const session=Number((cfg.periods||{})[r[1]]);if(!session)return;
   const cl=String(r[2]||"").trim();if(!classes[cl])return;
   const key=cl+"|"+session;
   if(!groups[key])groups[key]={className:cl,session:session,teachers:[],periods:[]};
   const teacher=String(r[3]||"").trim();
   if(teacher&&!groups[key].teachers.includes(teacher))groups[key].teachers.push(teacher);
   if(!groups[key].periods.includes(r[1]))groups[key].periods.push(r[1]);
 });
 const result=Object.keys(groups).map(key=>{
   const r=groups[key],time=sessions.find(s=>s.id===r.session),done=Boolean(saved[key]);
   r.saved=done;r.savedAt=saved[key]||"";
   if(done)r.status="saved";
   else if(!time||time.end===null)r.status="unverified";
   else if(current<time.start)r.status="upcoming";
   else if(current>=time.end)r.status="missed";
   else if(!active||active.id!==r.session)r.status="unverified";
   else r.status=current<time.start+10?"grace":"late";
   r.alertText="تنبيه تسجيل الغياب: الفصل "+r.className+"، Session "+r.session+"، المعلمون: "+r.teachers.join("، ");
   return r;
 });
 return {success:true,configured:true,rows:result,activeSession:active?active.id:null,late:result.filter(r=>r.status==="late").length,missed:result.filter(r=>r.status==="missed").length,unmatched:result.filter(r=>r.status==="unverified").length};
}
