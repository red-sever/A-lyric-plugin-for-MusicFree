"use strict";
// ……………………………………… 在线更新地址填写处 ………………………………………
// 把固定的公网 .js 原始文件直链填入下面的双引号，再重新本地安装一次。
// 留空时不显示“更新插件”和“分享插件”；以后在同一地址发布新版，并增加 VERSION。
var UPDATE_URL = "https://github.com/red-sever/A-lyric-plugin-for-MusicFree/releases/latest/download/MusicFree_SearchingLyric.js";
// ……………………………………… 在线更新地址填写结束 …………………………………

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var axiosModule = require("axios");
var axios = axiosModule.default || axiosModule;
var PLATFORM = "歌词检索";
var VERSION = "1.0.4";

var searchCache = new Map();
var lyricCache = new Map();
var pending = new Map();
var HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
var SELF_TEST_ID = "diagnostic:" + VERSION;
function selfTestLyric() {
    return { rawLrc: "[ti:插件自检]\n[ar:MusicFree " + PLATFORM + "]\n[00:00.00]" + PLATFORM + " " + VERSION + " 已加载\n[00:04.00]本段为本地测试，不需要联网\n[00:08.00]可返回歌词搜索，输入歌手 - 歌名" };
}
function logFailure(stage, error) {
    console.warn("[" + PLATFORM + "] " + stage + ": " + (error && error.message ? error.message : String(error)));
}
function text(value) {
    return value == null ? "" : String(value).trim();
}
function decodeEntities(value) {
    var named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
    return text(value).replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, function (whole, entity) {
        if (entity[0] !== "#")
            return named[entity.toLowerCase()] || whole;
        var hex = entity[1].toLowerCase() === "x";
        var code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
        return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : whole;
    });
}
function cleanMeta(value) {
    var s = text(value);
    return /^(未知|未知歌手|未知艺术家|未知专辑|未知标题|unknown(?: artist| album| title)?|<unknown>)$/i.test(s) ? "" : s;
}
function options() {
    var vars = {};
    try {
        if (typeof env !== "undefined") {
            vars = (typeof env.getUserVariables === "function" ? env.getUserVariables() : env.userVariables) || {};
        }
    }
    catch (_) { }
    var choice = text(vars.source).toLowerCase();
    var seconds = Number(vars.timeout);
    return {
        sources: choice === "qq" ? ["qq"] : choice === "netease" ? ["netease"] : ["netease", "qq"],
        translation: text(vars.translation).toLowerCase() !== "off",
        timeout: Number.isFinite(seconds) && seconds > 0 ? Math.max(3000, Math.min(30000, seconds * 1000)) : 8000,
    };
}
function cached(cache, key) {
    var entry = cache.get(key);
    if (!entry)
        return undefined;
    if (entry.until <= Date.now()) {
        cache.delete(key);
        return undefined;
    }
    return entry.value;
}
function remember(cache, key, value, ttl) {
    cache.delete(key);
    cache.set(key, { value: value, until: Date.now() + ttl });
    if (cache.size > 100)
        cache.delete(cache.keys().next().value);
}
function once(key, run) {
    return __awaiter(this, void 0, void 0, function () {
        var promise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (pending.has(key))
                        return [2, pending.get(key)];
                    promise = Promise.resolve().then(run);
                    pending.set(key, promise);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4, promise];
                case 2: return [2, _a.sent()];
                case 3:
                    pending.delete(key);
                    return [7];
                case 4: return [2];
            }
        });
    });
}
function json(data) {
    if (data && typeof data === "object")
        return data;
    var str = text(data);
    try {
        return JSON.parse(str);
    }
    catch (_) {
        var match = str.match(/^[\w.$]+\s*\(([\s\S]*)\)\s*;?$/);
        if (match)
            return JSON.parse(match[1]);
        throw new Error("歌词服务返回了无法解析的数据");
    }
}
function request(url, post, qq) {
    return __awaiter(this, void 0, void 0, function () {
        var config, response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    config = {
                        timeout: options().timeout,
                        headers: Object.assign({}, HEADERS, { Referer: qq ? "https://y.qq.com/" : "https://music.163.com/" }),
                        maxContentLength: 2 * 1024 * 1024,
                    };
                    if (!post) return [3, 2];
                    return [4, axios.post(url, null, config)];
                case 1:
                    _a = _b.sent();
                    return [3, 4];
                case 2: return [4, axios.get(url, config)];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    response = _a;
                    return [2, json(response.data)];
            }
        });
    });
}
function normalizeItem(source, song) {
    var isQQ = source === "qq";
    var id = text(isQQ ? song.songmid : song.id);
    if (!id || id === "0")
        return null;
    var artists = isQQ ? song.singer : song.artists;
    var decode = decodeEntities;
    var item = {
        id: source + ":" + id,
        platform: PLATFORM,
        title: decode(isQQ ? song.songname : song.name),
        artist: (Array.isArray(artists) ? artists : []).map(function (a) { return decode(a.name); }).filter(Boolean).join("/"),
        album: decode(isQQ ? song.albumname : (song.album || {}).name),
        duration: Math.max(0, Number(isQQ ? song.interval : Number(song.duration) / 1000) || 0),
        artwork: "",
    };
    return item.title ? item : null;
}
function searchSource(source, keyword) {
    return __awaiter(this, void 0, void 0, function () {
        var key, hit;
        var _this = this;
        return __generator(this, function (_a) {
            key = source + "|" + keyword;
            hit = cached(searchCache, key);
            if (hit)
                return [2, hit.map(function (item) { return Object.assign({}, item); })];
            return [2, once("search|" + key, function () { return __awaiter(_this, void 0, void 0, function () {
                    var encoded, songs, data, data, items;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                encoded = encodeURIComponent(keyword);
                                if (!(source === "netease")) return [3, 2];
                                return [4, request("https://music.163.com/api/search/get/?s=" + encoded + "&limit=20&type=1&offset=0", false, false)];
                            case 1:
                                data = _a.sent();
                                if (data.code != null && Number(data.code) !== 200)
                                    throw new Error("网易云搜索暂不可用");
                                songs = data.result && data.result.songs;
                                return [3, 4];
                            case 2: return [4, request("https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=20&w=" + encoded + "&format=json", false, true)];
                            case 3:
                                data = _a.sent();
                                if (data.code != null && Number(data.code) !== 0)
                                    throw new Error("QQ 音乐搜索暂不可用");
                                songs = data.data && data.data.song && data.data.song.list;
                                _a.label = 4;
                            case 4:
                                items = (Array.isArray(songs) ? songs : []).map(function (song) { return normalizeItem(source, song); }).filter(Boolean);
                                if (items.length)
                                    remember(searchCache, key, items, 5 * 60 * 1000);
                                return [2, items.map(function (item) { return Object.assign({}, item); })];
                        }
                    });
                }); })];
        });
    });
}
function characterSimilarity(a, b) {
    if (a === b)
        return 1;
    if (/^[A-Za-z]$/.test(a) && a.toLowerCase() === b.toLowerCase())
        return 0.8;
    var digits = "零一二三四五六七八九";
    if ((/^\d$/.test(a) && digits[Number(a)] === b) || (/^\d$/.test(b) && digits[Number(b)] === a))
        return 0.7;
    return 0;
}
function similarity(a, b) {
    a = text(a);
    b = text(b);
    if (!a || !b || a.length > 256 || b.length > 256)
        return 0;
    var previous = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    for (var i = 1; i <= a.length; i++) {
        var row = [i];
        for (var j = 1; j <= b.length; j++) {
            row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + 1 - characterSimilarity(a[i - 1], b[j - 1]));
        }
        previous = row;
    }
    return 1 - previous[b.length] / Math.max(a.length, b.length);
}
function targetInfo(item) {
    var filename = text(item.fileName || item.filename);
    if (!filename) {
        var path = text(item.url || (item.$ && item.$.localPath));
        if (path && !/^https?:/i.test(path)) {
            filename = path.split(/[\\/]/).pop().split(/[?#]/)[0];
            try {
                filename = decodeURIComponent(filename);
            }
            catch (_) { }
        }
    }
    filename = filename.replace(/\.(mp3|flac|wav|m4a|aac|ogg|opus|wma|ape|aiff?)$/i, "");
    return { title: cleanMeta(item.title || item.alias), artist: cleanMeta(item.artist), album: cleanMeta(item.album), filename: filename };
}
function keywordFor(target) {
    return target.title ? (target.artist ? target.artist + " " : "") + target.title : target.filename;
}
function artistTitlePair(value) {
    var match = text(value).match(/^(.+?)\s*[-－–—]\s*(.+)$/);
    if (!match)
        return null;
    if (!/\s[-－–—]\s/.test(value) && !(/[\u3400-\u9fff]/.test(match[1]) && /[\u3400-\u9fff]/.test(match[2])))
        return null;
    return { artist: match[1].trim(), title: match[2].trim() };
}
function titleForComparison(value) {
    return text(value).replace(/[（(【\[]([^）)】\]]+)[）)】\]]\s*$/g, function (whole, note) {
        return /电视剧|电影|网剧|动画|主题曲|片头曲|片尾曲|插曲|\bOST\b|歌词|字幕|\bMV\b|完整版|纯享/i.test(note) ? "" : whole;
    }).trim();
}
function titleSimilarity(a, b) {
    return Math.max(similarity(a, b), similarity(titleForComparison(a), titleForComparison(b)));
}
function searchPlans(target) {
    var plans = [];
    var seen = new Set();
    function add(info, keyword) {
        keyword = text(keyword || keywordFor(info));
        if (!keyword || keyword.length > 256 || seen.has(keyword))
            return;
        seen.add(keyword);
        plans.push({ target: info, keyword: keyword });
    }
    add(target);
    var original = target.title || target.filename;
    var cleaned = original;
    var colon = Math.max(original.lastIndexOf("："), original.lastIndexOf(":"));
    if (colon > 0) {
        var suffix = original.slice(colon + 1).trim();
        if (artistTitlePair(suffix))
            cleaned = suffix;
    }
    var pair = artistTitlePair(cleaned);
    var refined = pair
        ? { title: pair.title, artist: pair.artist, album: target.album, filename: "", inferredArtist: true }
        : Object.assign({}, target, { title: titleForComparison(original) });
    add(refined);
    if (refined.artist)
        add(refined, refined.title);
    return plans.slice(0, 3);
}
function rank(items, target) {
    var title = target.title || target.filename;
    var ranked = items.map(function (item, index) { return ({ item: item, index: index, titleScore: titleSimilarity(title, item.title),
        artistScore: similarity(target.artist, item.artist),
        score: titleSimilarity(title, item.title) * 0.4
            + similarity(target.artist, item.artist) * 0.4
            + similarity(target.album, item.album) * 0.3
            + similarity(target.filename, item.title) * 0.3
            + similarity(target.filename, item.artist) * 0.3
            + (1 - index * 0.02) * 0.05, }); });
    return ranked.filter(function (it) { return it.score >= 0.3 && it.titleScore >= 0.55 && (!target.inferredArtist || it.artistScore >= 0.35); })
        .sort(function (a, b) { return b.score - a.score || a.index - b.index; }).map(function (it) { return it.item; });
}
function candidatesForPlan(target, keyword, sources) {
    return __awaiter(this, void 0, void 0, function () {
        var batches, unique;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, Promise.all(sources.map(function (source) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, error_1;
                        var _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    _b = {};
                                    _a = rank;
                                    return [4, searchSource(source, keyword)];
                                case 1: return [2, (_b.data = _a.apply(void 0, [_c.sent(), target]), _b)];
                                case 2:
                                    error_1 = _c.sent();
                                    logFailure(source + " 搜索失败", error_1);
                                    return [2, { data: [], error: error_1 }];
                                case 3: return [2];
                            }
                        });
                    }); }))];
                case 1:
                    batches = _a.sent();
                    if (batches.every(function (batch) { return batch.error; })) {
                        throw new Error("歌词服务请求失败，请检查网络或在插件设置中调整来源和超时。" + batches.map(function (batch, i) { return sources[i] + ": " + batch.error.message; }).join("；"));
                    }
                    unique = new Map();
                    batches.forEach(function (batch) { return batch.data.forEach(function (item) { return unique.set(item.id, item); }); });
                    return [2, rank(Array.from(unique.values()), target)];
            }
        });
    });
}
function candidates(target, sources) {
    return __awaiter(this, void 0, void 0, function () {
        var plans, plans_1, plans_1_1, plan, result, e_1_1;
        var e_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    plans = searchPlans(target);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    plans_1 = __values(plans), plans_1_1 = plans_1.next();
                    _b.label = 2;
                case 2:
                    if (!!plans_1_1.done) return [3, 5];
                    plan = plans_1_1.value;
                    return [4, candidatesForPlan(plan.target, plan.keyword, sources)];
                case 3:
                    result = _b.sent();
                    if (result.length)
                        return [2, result];
                    _b.label = 4;
                case 4:
                    plans_1_1 = plans_1.next();
                    return [3, 2];
                case 5: return [3, 8];
                case 6:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3, 8];
                case 7:
                    try {
                        if (plans_1_1 && !plans_1_1.done && (_a = plans_1.return)) _a.call(plans_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7];
                case 8: return [2, []];
            }
        });
    });
}
function lyricText(value, decodeHTML) {
    var s = text(value).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    if (decodeHTML)
        s = decodeEntities(s).replace(/\r\n?/g, "\n");
    if (!s || s.length > 1024 * 1024 || /^\s*[<{]/.test(s))
        return "";
    var body = s.replace(/\[[^\]\n]*\]/g, "").trim();
    if (!body || /^(纯音乐[，,]?\s*请欣赏|此歌曲为没有填词的纯音乐[，,]?\s*请您欣赏|\/?\/?)$/i.test(body))
        return "";
    return s;
}
function addTags(lrc, item) {
    var header = "";
    [["ti", item.title], ["ar", item.artist], ["al", item.album]].forEach(function (pair) {
        if (pair[1] && !new RegExp("\\[" + pair[0] + ":[^\\]\\n]+\\]", "i").test(lrc)) {
            header += "[" + pair[0] + ":" + text(pair[1]).replace(/[\[\]\r\n]/g, " ") + "]\n";
        }
    });
    return header + lrc;
}
function fetchLyric(item, withTranslation) {
    return __awaiter(this, void 0, void 0, function () {
        var match, key, hit;
        var _this = this;
        return __generator(this, function (_a) {
            match = text(item.id).match(/^(netease|qq):([A-Za-z0-9]+)$/);
            if (!match)
                return [2, null];
            key = item.id + "|" + withTranslation;
            hit = cached(lyricCache, key);
            if (hit)
                return [2, Object.assign({}, hit)];
            return [2, once("lyric|" + key, function () { return __awaiter(_this, void 0, void 0, function () {
                    var source, id, raw, translated, data, data, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                source = match[1], id = encodeURIComponent(match[2]);
                                if (!(source === "netease")) return [3, 2];
                                return [4, request("https://music.163.com/api/song/lyric?os=osx&id=" + id + "&lv=-1&kv=-1&tv=-1", false, false)];
                            case 1:
                                data = _a.sent();
                                if ((data.code != null && Number(data.code) !== 200) || data.nolyric || data.uncollected)
                                    return [2, null];
                                raw = lyricText(data.lrc && data.lrc.lyric, false);
                                translated = withTranslation ? lyricText(data.tlyric && data.tlyric.lyric, false) : "";
                                return [3, 4];
                            case 2: return [4, request("https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=" + id + "&format=json&nobase64=1", false, true)];
                            case 3:
                                data = _a.sent();
                                if (data.code != null && Number(data.code) !== 0)
                                    return [2, null];
                                raw = lyricText(data.lyric, true);
                                translated = withTranslation ? lyricText(data.trans, true) : "";
                                _a.label = 4;
                            case 4:
                                if (!raw)
                                    return [2, null];
                                result = { rawLrc: addTags(raw, item) };
                                if (translated)
                                    result.translation = translated;
                                remember(lyricCache, key, result, 30 * 60 * 1000);
                                return [2, Object.assign({}, result)];
                        }
                    });
                }); })];
        });
    });
}
module.exports = {
    platform: PLATFORM,
    version: VERSION,
    author: "Red_sever",
    srcUrl: UPDATE_URL,
    description: "基于网易云和QQ音乐的歌词检索插件，支持歌词翻译。\n\n更新失败请尝试链接“https://gitee.com/red_sever/a-lyric-plugin-for-music-free/releases/download/latest/MusicFree_SearchingLyric.js”",
    primaryKey: ["id"],
    supportedSearchType: ["lyric"],
    userVariables: [
        { key: "source", name: "歌词来源", hint: "auto（默认，双源） / netease（网易云） / qq（QQ音乐）" },
        { key: "translation", name: "歌词翻译", hint: "on（默认） / off（关闭）" },
        { key: "timeout", name: "请求超时（秒）", hint: "默认 8；可填 3～30，线路较慢时可填 20" },
    ],
    search: function (query, page, type) {
        return __awaiter(this, void 0, void 0, function () {
            var keyword, split, target;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if ((type && type !== "lyric") || Number(page || 1) !== 1)
                            return [2, { isEnd: true, data: [] }];
                        keyword = text(query);
                        if (!keyword || keyword.length > 256)
                            return [2, { isEnd: true, data: [] }];
                        if (keyword === "插件自检" || keyword === "plugin-test") {
                            return [2, { isEnd: true, data: [{ id: SELF_TEST_ID, platform: PLATFORM, title: "插件自检（无需联网）", artist: PLATFORM + " " + VERSION, album: "只验证加载，不验证网络", duration: 0, artwork: "" }] }];
                        }
                        split = keyword.indexOf(" - ");
                        target = split > 0
                            ? { title: keyword.slice(split + 3).trim(), artist: keyword.slice(0, split).trim().split(/[：:]/).pop().trim(), album: "", filename: "" }
                            : { title: keyword, artist: "", album: "", filename: "" };
                        _a = { isEnd: true };
                        return [4, candidates(target, options().sources)];
                    case 1: return [2, (_a.data = _b.sent(), _a)];
                }
            });
        });
    },
    getLyric: function (musicItem) {
        return __awaiter(this, void 0, void 0, function () {
            var config, directId, tried, result, error_2, items, attempts, items_1, items_1_1, item, result, error_3, e_2_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!musicItem || typeof musicItem !== "object")
                            throw new Error("缺少歌曲信息");
                        if (musicItem.id === SELF_TEST_ID)
                            return [2, selfTestLyric()];
                        config = options();
                        directId = /^(netease|qq):[A-Za-z0-9]+$/.test(text(musicItem.id));
                        tried = new Set();
                        if (!directId) return [3, 4];
                        tried.add(musicItem.id);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4, fetchLyric(musicItem, config.translation)];
                    case 2:
                        result = _b.sent();
                        if (result)
                            return [2, result];
                        return [3, 4];
                    case 3:
                        error_2 = _b.sent();
                        logFailure("获取 " + musicItem.id + " 歌词失败，将尝试重新匹配", error_2);
                        return [3, 4];
                    case 4: return [4, candidates(targetInfo(musicItem), config.sources)];
                    case 5:
                        items = _b.sent();
                        attempts = 0;
                        _b.label = 6;
                    case 6:
                        _b.trys.push([6, 13, 14, 15]);
                        items_1 = __values(items), items_1_1 = items_1.next();
                        _b.label = 7;
                    case 7:
                        if (!!items_1_1.done) return [3, 12];
                        item = items_1_1.value;
                        if (tried.has(item.id))
                            return [3, 11];
                        if (++attempts > 3)
                            return [3, 12];
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 10, , 11]);
                        return [4, fetchLyric(item, config.translation)];
                    case 9:
                        result = _b.sent();
                        if (result)
                            return [2, result];
                        return [3, 11];
                    case 10:
                        error_3 = _b.sent();
                        logFailure("获取 " + item.id + " 歌词失败，将尝试其他结果", error_3);
                        return [3, 11];
                    case 11:
                        items_1_1 = items_1.next();
                        return [3, 7];
                    case 12: return [3, 15];
                    case 13:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 15];
                    case 14:
                        try {
                            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7];
                    case 15: throw new Error("没有获取到可用歌词，请在歌词页点击放大镜，输入「歌手 - 歌名」重新搜索并关联。");
                }
            });
        });
    },
};
