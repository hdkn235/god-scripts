// 拉取豆瓣图书信息同步到notion中

const axios = require("axios");
const cheerio = require("cheerio");
const notionApi = require("./notion-api");

// 书单数据库ID
const NOTION_DATABASE_ID = "";

const READ_STATUS = {
    WANT_READ: "想读",
    READING: "在读",
    HAVE_READ: "已读",
};

// const READ_STATUS_MAPPING = {
//     我想读这本书: READ_STATUS.WANT_READ,
//     我最近在读这本书: READ_STATUS.READING,
//     我读过这本书: READ_STATUS.HAVE_READ,
// };

// 根据URL解析豆瓣图书信息
async function pullDoubanBook(urlInfo) {
    let headers = {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, sdch",
        "Accept-Language": "zh-CN,zh;q=0.8",
        Connection: "keep-alive",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.235",
    };

    let response = await axios.get(urlInfo.url, {
        headers: headers,
    });

    let book = { url: urlInfo.url };
    let $ = cheerio.load(response.data);
    // 封面
    book.cover = $(".nbg").attr("href");
    // 标题
    book.title = $("h1 span").text();
    // TODO:阅读状态 需要登录才能获取到
    // let status = $("#interest_sect_level .mr10").text().replaceAll(" ", "");
    // book.readStatus = READ_STATUS_MAPPING[status];
    book.readStatus = urlInfo.readStatus;
    // 书籍类型
    book.bookType = urlInfo.bookType;
    // 详细信息
    let infos = $("#info span.pl");
    infos.each((idx, el) => {
        let key = $(el).text().replaceAll(" ", "").replaceAll(":", "");
        if ("作者" === key) {
            let authors = $(el).nextUntil("span", "a");
            let authorArr = [];
            authors.each((idx, at) => {
                authorArr.push(
                    $(at).text().replaceAll(" ", "").replaceAll("\n", "")
                );
            });
            book.author = authorArr.join(" / ");
        } else if ("出版社" === key) {
            book.publisher = $(el).next("a").text();
        }
    });
    // 豆瓣评分
    book.score = $(".rating_num").text().replaceAll(" ", "");
    console.log("======解析豆瓣读书网页结果======\n" + JSON.stringify(book));
    return book;
}

// 添加Notion读书清单
async function addNotionBook(book) {
    let body = {
        parent: {
            type: "database_id",
            database_id: NOTION_DATABASE_ID,
        },
        properties: {
            书名: {
                title: [{ type: "text", text: { content: book.title } }],
            },
            豆瓣链接: {
                url: book.url,
            },
            出版社: {
                rich_text: [
                    { type: "text", text: { content: book.publisher } },
                ],
            },
            豆瓣评分: {
                number: parseFloat(book.score),
            },
            阅读状态: {
                select: { name: book.readStatus },
            },
            书籍类型: {
                select: { name: book.bookType },
            },
            作者: {
                rich_text: [{ type: "text", text: { content: book.author } }],
            },
            封面: {
                files: [
                    {
                        type: "external",
                        name: "cover",
                        external: { url: book.cover },
                    },
                ],
            },
        },
    };
    notionApi.createPage(body);
}

// 删除重复图书
async function deleteNotionRepeatBook(url) {
    let queryData = {
        filter: {
            property: "豆瓣链接",
            url: {
                contains: url,
            },
        },
    };
    let result = await notionApi.queryDataBase(NOTION_DATABASE_ID, queryData);
    if (result.results && result.results.length > 0) {
        for (const page of result.results) {
            await notionApi.deletePage(page.id);
        }
    }
}

// 同步book信息
function syncBookinfo(urlInfos) {
    for (const urlInfo of urlInfos) {
        // 删除重复book
        deleteNotionRepeatBook(urlInfo.url)
            .then(() => {
                // 重新拉取最新book信息
               return pullDoubanBook(urlInfo);
            })
            .then((book) => {
                // 添加book
                addNotionBook(book);
            });
    }
}

let urlInfos = [
    {
        url: "https://book.douban.com/subject/6125543/",
        readStatus: READ_STATUS.WANT_READ,
        bookType: "纪实",
    },
];
syncBookinfo(urlInfos);

// deleteNotionRepeatBook("https://book.douban.com/subject/10484692/");
