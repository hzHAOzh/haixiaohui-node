# “海小慧”课表小程序后端API

> **测试号为 stuId: test，password: 123456**

## 支持的接口列表
1. 登录
2. 获取课表
3. 获取成绩
4. 获取原始成绩(青果系统)
5. 获取考勤

## 环境要求

NodeJS 16+

## 安装

```shell
git clone https://github.com/danbaixi/UAAS-API.git
cd UAAS-API
npm install
```
## 配置文件
拷贝`env.example`，重命名为`.env`，`SCHOOL_CODE`填学校代号，默认为`test`

## 运行

默认使用`3000`端口，可自行设置`.env`中的`PORT`

```shell
npm start
```
