const request = require("../requests/12046")
const cheerio = require("cheerio")
const { encodeInp, parseWeeks, getCookiesFromHeaders } = require("../util/util")
const { scoreParser } = require("../parsers/qiangzhi")

// 登录初始化
const loginInit = async () => {
  let formDataRaw = null
  try {
    formDataRaw = await request.getLoginFormRequest()
  } catch (err) {
    // 412的情况
    // 携带返回的cookie再去请求一次
    let cookie = getCookiesFromHeaders(err.response.headers)
    formDataRaw = await request.getLoginFormRequest(cookie)
  }
  const cookie = getCookiesFromHeaders(formDataRaw.headers)
  if (cookie == "") {
    throw new Error("获取cookie失败，请检查教务系统是否限制了本机访问")
  }
  return cookie
}

// 登录验证码
const getLoginVerifyCode = async (cookie) => {
  const content = await request.getLoginVerifyCodeRequest(cookie)
  return content
}

// 登录
const login = async (stuId, password, verifyCode) => {
  // 获取cookie
  const cookie = await loginInit()
  const encoded = `${encodeInp(stuId)}%%%${encodeInp(password)}`
  const postData = {
    RANDOMCODE: verifyCode,
    userAccount: stuId,
    userPassword: "",
    encoded,
  }
  const res = await request.loginRequest(cookie, postData)
  const $ = cheerio.load(res.data)
  const errMsg = $("#showMsg").text().trim()
  // 登录成功
  if (errMsg == "") {
    return cookie
  }
  throw new Error(errMsg)
}

// 获取课表
const getCourseList = async (cookie) => {
  const formContent = await request.getCoursesFormRequest(cookie)
  const form$ = cheerio.load(formContent)
  // 获取当前选中学期
  const xnxq01id = form$("#xnxq01id option[selected='selected']").val()
  // 获取kbjcmsid
  const kbjcmsid = form$("#kbjcmsid option[selected='selected']").val()
  const postData = {
    cj0701id: "",
    zc: "",
    demo: "",
    sfFD: 1,
    wkbkc: 1,
    xnxq01id,
    kbjcmsid,
  }
  const content = await request.getCoursesRequest(cookie, postData)
  const courses = []
  // font title 索引
  const fontTitleRef = {
    教师: "teacher",
    "周次(节次)": "rawWeeks",
    教室: "address",
  }
  const $ = cheerio.load(content)
  const trs = $("#timetable tbody tr").slice(1)
  $(trs).each((trIndex, tr) => {
    $(tr)
      .find("td")
      .each((tdIndex, td) => {
        const fonts = $(td).find(".kbcontent font")
        if (fonts.length > 0) {
          // trIndex表示节次，tdIndex表示星期
          // 0:1-2，1:3-4以此类推
          // tdIndex=0周一，=1周二，以此类推
          let course = {
            section: trIndex * 2 + 1,
            sectionCount: 2, // 固定两小节
            week: tdIndex + 1,
          }
          fonts.each((fIndex, f) => {
            // font 元素
            const fontTitle = $(f).attr("title")
            const fontText = $(f).text()
            // 课程名称
            if (fIndex == 0) {
              course.name = fontText
            } else if (fontTitle != undefined && fontTitleRef[fontTitle]) {
              course[fontTitleRef[fontTitle]] = fontText
            }
          })
          // 解析周次
          const pattern = /(\S+)\((\S+)\)\[(\S+)\]/
          const match = pattern.exec(course.rawWeeks)
          console.log(match, course)
          const fullWeek =
            match[2] == "周" ? "" : match[2] == "单周" ? "单" : "双"
          course["weeks"] = parseWeeks(match[1], fullWeek)
          courses.push(course)
        }
      })
  })
  return courses
}

// 获取成绩
const getScoreList = async (cookie) => {
  const postData = {
    kksj: "",
    kcxz: "",
    kcsx: "",
    kcmc: "",
    xsfs: all,
    mold: "",
  }
  const content = await request.getScoresRequest(cookie, postData)
  const $ = cheerio.load(content)
  const scores = scoreParser($)
  return scores
}

// 获取考勤
const getAttendanceList = async (cookie) => {
  const attendances = []
  return attendances
}

module.exports = {
  loginInit,
  getLoginVerifyCode,
  login,
  getCourseList,
  getScoreList,
  getAttendanceList,
}
