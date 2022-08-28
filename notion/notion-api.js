const axios = require("axios");

// notion的授权token
const NOTION_TOKEN = "";

// notion接口的请求头
const NOTION_HEADERS = {
    Accept: "application/json",
    Authorization: "Bearer " + NOTION_TOKEN,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

// 新增一个page
async function createPage(body) {
    let options = {
        method: "POST",
        url: "https://api.notion.com/v1/pages",
        headers: NOTION_HEADERS,
        data: JSON.stringify(body),
    };

    let response = await axios.request(options);
    console.log(
        "======添加Notion的page结果======\n" + JSON.stringify(response.data)
    );
}

// 删除page
async function deletePage(pageId) {
    let data = {
        archived: true,
    };
    updatePage(pageId, data);
}

// 修改page
async function updatePage(pageId, body) {
    let options = {
        method: "PATCH",
        url: `https://api.notion.com/v1/pages/${pageId}`,
        headers: NOTION_HEADERS,
        data: JSON.stringify(body),
    };

    let response = await axios.request(options);
    console.log(
        "======修改Notion的page结果======\n" + JSON.stringify(response.data)
    );
}

// 获取Notion数据库信息
async function queryDataBase(databaseId, data) {
    let options = {
        method: "POST",
        url: "https://api.notion.com/v1/databases/" + databaseId + "/query",
        headers: NOTION_HEADERS,
        data: data,
    };

    let notionData = await axios.request(options);
    console.log(
        "======获取Notion数据库信息======" + JSON.stringify(notionData.data)
    );
    return notionData.data;
}

// 批量对外暴露方法
module.exports = { createPage, queryDataBase, updatePage, deletePage };
