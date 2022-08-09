//при первой загрузке выполняются эти функции
$(document).ready(function () {
    refreshTable();
    fillDropDownListForCreatingPlayer();
});

//метод получает таблицу с размером выбранным в списке и на конкретной странице. Внутри другой метод заполнения.
function createTableWithSizeAndPageNumParam(selectedCountOfRows, pageNumber) {
    $.ajax({
        url: "/rest/players",
        type: 'get',
        dataType: 'JSON',
        data: {
            pageSize: selectedCountOfRows,
            pageNumber: pageNumber
        },
        async: false,
        success: function (data) {
            fillTable(data)
        }
    });
}

//заполнение таблицы конкретными значениями
let fillTable = function (data) {
    for (const obj of data) {
        $("#table > tbody").append(`<tr id=\"trID${obj.id}\">` +
            "<td>" + obj.id + "</td>" +
            "<td>" + obj.name + "</td>" +
            "<td>" + obj.title + "</td>" +
            "<td>" + obj.race + "</td>" +
            "<td>" + obj.profession + "</td>" +
            "<td>" + obj.level + "</td>" +
            "<td>" + new Date(obj.birthday).toLocaleDateString() + "</td>" +
            "<td>" + obj.banned + "</td>" +
            "<td>" + `<img src=\"../img/edit2.png\" id =\"editImgId${obj.id}\" alt=\"Edit\" onclick=\"editRow(${obj.id})\" width=30 height=30 style=\"visibility:visible \">` + "</td>" +
            "<td>" + `<img src=\"../img/delete2.png\" id =\"deleteImgId${obj.id}\" alt=\"Delete\" onclick=\"deleteRow(${obj.id})\" width=30 height=30 style=\"visibility:visible \">` +
            "</td></tr>");
    }
};

//метод создает блок переключ страниц с АКТИВНОЙ стр №1
function createPages(pagesRequired) {
    let pageBlock = $(".pagination");
    pageBlock.html("");
    for (let i = 1; i <= pagesRequired; i++) {
        pageBlock.append(`<a href=\"#\" id=\"page${i}\" onclick=\"goToPage(${i})\">${i}</a>`);
        if(i === 1){
            $(`#page1`).attr('class', 'active');
        }
    }
}

//Переключение страниц (очистка, класс Актив на другую стр, инициализация таблицы)
function goToPage(pageNumber) {

    let currentActivePageLink = $(".pagination > a.active");
    currentActivePageLink.removeAttr('class');
    //проверка не больше ли передаваемая стр чем общее кол-во стр. Если больше - создает новую.
    if ($(".pagination > :last-child").text() < totalPagesCounter()){
        let newLastPageNum = totalPagesCounter();
        $(".pagination").append(`<a href=\"#\" id=\"page${newLastPageNum}\" onclick=\"goToPage(${newLastPageNum})\">${newLastPageNum}</a>`);
    }
    $(`.pagination > a:nth-child(${pageNumber})`).attr('class', 'active');
    refreshTable(pageNumber)
}

//счетчик кол-ва необходимых страниц (отдает число). Оно же число последней страницы!
let totalPagesCounter = function () {
    let selectedCountOfRows = $("#counter option:selected").val();
    return Math.ceil(totalAccountsCount() / selectedCountOfRows);
}

//номер текущей страницы. Отдает нулл если нет текцщей страницы (тег active)
let getCurrentPage = function () {
    let page = $("body > div > a.active").text();
    if (!page){
        return null
    } else return page;
}

//количество всех аккаунтов в БД
let totalAccountsCount = function totalAccountsCount() {
    let result = null;
    let scriptUrl = "/rest/players/count";
    $.ajax({
        url: scriptUrl,
        type: 'get',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            result = data;
            console.log(("Total accounts - " + result));
        }
    });
    return result;
}

//значение кол-ва отображаемых рядков. По умолчанию нулл (3 рядка)
let getSelectedCountOfRows = function () {
    let rows = $("#counter option:selected").val();
    if (!rows){
        return null
    } else return rows;
}

//функционал нажатия на кнопку Редактиировать
function editRow(id) {
    $(`#deleteImgId${id}`).attr('style', 'visibility:hidden');
    let editingImg = $(`#editImgId${id}`);
    editingImg.attr('src', '../img/save2.png');
    editingImg.attr('alt', 'Save');
    editingImg.attr('onclick', `saveFunction(${id})`);
    editingImg.attr('id', `saveImgId${id}`);
    $(`#trID${id} > td:nth-child(2)`).attr('contenteditable', 'true');
    $(`#trID${id} > td:nth-child(3)`).attr('contenteditable', 'true');
    let raceSelector = $(`#trID${id} > td:nth-child(4)`);
    let professionSelector = $(`#trID${id} > td:nth-child(5)`);
    let bannedSelector = $(`#trID${id} > td:nth-child(8)`);
    let defaultRaceValue = raceSelector.text();
    let defaultProfessionValue = professionSelector.text();
    let defaultBannedValue = (bannedSelector.text() === 'true');
    raceSelector.replaceWith(createHtmlDropDownList(getListOfProperties().raceList, "raceList", defaultRaceValue));
    professionSelector.replaceWith(createHtmlDropDownList(getListOfProperties().professionList, "professionList", defaultProfessionValue));
    bannedSelector.replaceWith(createHtmlDropDownList(getListOfProperties().bannedList, "bannedList", defaultBannedValue));
}

//создание и заполнение выпадающего списка опций при редактировании игрока
let createHtmlDropDownList = function (list, idName, defaultValue) {
    let optionsBlock = function (list) {
        let resultOptionBlock = "";
        for (const element of list) {
            var optionTag = "\n<option value=\"" + element + "\">" + element + "</option>\n";
            if (element === defaultValue) {
                optionTag = "\n<option value=\"" + element + "\" selected>" + element + "</option>\n";
            }
            resultOptionBlock += optionTag;
        }
        return resultOptionBlock;
    }
    return "<td><select id=\"" + idName + "\">\n" + optionsBlock(list) + "\n</select></td>";
}

//получение данных и создание объекта содержащего списки всех возможных опций по настройке игрока для выпадающих списков
let getListOfProperties = function () {
    let objectOfProperties = null;
    $.ajax({
        url: "/rest/players/",
        type: 'get',
        data: {
            pageSize: totalAccountsCount(),
        },
        dataType: 'JSON',
        async: false,
        success: function (data) {
            const raceSet = new Set();
            const professionSet = new Set();
            const levelSet = new Set();
            const bannedSet = new Set();
            for (const obj of data) {
                raceSet.add(obj.race);
                professionSet.add(obj.profession);
                levelSet.add(obj.level);
                bannedSet.add(obj.banned);
            }
            const raceList = Array.from(raceSet).sort();
            const professionList = Array.from(professionSet).sort();
            const levelList = Array.from(levelSet).sort(function (a, b) {
                return a - b;
            });
            const bannedList = Array.from(bannedSet).sort();
            objectOfProperties = {
                raceList: raceList,
                professionList: professionList,
                levelList: levelList,
                bannedList: bannedList
            };
        },
        error: function () {
            console.log("ERROR");
        }
    });
    return objectOfProperties;
}

//функционал кнопки сохранения игрока после редактирования
function saveFunction(id) {
    let savingObject = JSON.stringify({
        name: $(`#trID${id} > td:nth-child(2)`).text(),
        title: $(`#trID${id} > td:nth-child(3)`).text(),
        race: $(`#trID${id} > td:nth-child(4) option:selected`).text(),
        profession: $(`#trID${id} > td:nth-child(5) option:selected`).text(),
        banned: $(`#trID${id} > td:nth-child(8) option:selected`).text()
    });
    $.ajax({
        type: 'POST',
        url: `/rest/players/${id}`,
        contentType: 'application/json',
        data: savingObject,
        async: false,
        success: function (){
            refreshTable(getCurrentPage());
        },
        error: function (data){
            alert("Error - " + data);
        }
    });
}

//рефреш таблицы на текущей странице. Если нет текущей - переход на первую.
let refreshTable = function (pageNumber) {
    $("#table > tbody").html("");
    if(!pageNumber){
        createPages(totalPagesCounter());
        createTableWithSizeAndPageNumParam(getSelectedCountOfRows(), null);
    }
    else createTableWithSizeAndPageNumParam(getSelectedCountOfRows(), pageNumber - 1);
}

//функционал кнопки Удаления игрока
function deleteRow(id) {
    $.ajax({
        url: `/rest/players/${id}`,
        type: 'DELETE',
        async: false,
        success: function () {
            refreshTable(getCurrentPage());
        }
    });
}

//функционал создания игрока
function createPlayer(){
    let dateOfBirth = new Date($("#birthdaySelect").val()).getTime();
    //сбор введенных данных с формы
    let savingObject = JSON.stringify({
        name: $("#nameInput").val(),
        title: $("#titleInput").val(),
        race: $("#raceSelect").val(),
        profession: $("#professionSelect").val(),
        level: $("#levelSelect").val(),
        birthday: dateOfBirth,
        banned: $("#bannedSelect").val()
    });
    //пост собранных данных
    $.ajax({
        type: 'POST',
        url: '/rest/players/',
        contentType: 'application/json',
        data: savingObject,
        async: false,
        success: function (){
            //после успеха должен открыть последнюю страницу и тейбл рефреш
            refreshTable(totalPagesCounter());
            goToPage(totalPagesCounter());
            //очистка полей создания игрока
            $("#resetButton").click();
        },
        error: function (data){
            console.log(("Error - " + data));
        }
    });
}

//функция заполнения выпадающих списков в поле создания игрока
function fillDropDownListForCreatingPlayer(){
    let list = getListOfProperties();
    for (const race of list.raceList) {
        $('#raceSelect').append(`<option value=\"${race}\">${race}</option>`)
    }
    for (const profession of list.professionList) {
        $('#professionSelect').append(`<option value=\"${profession}\">${profession}</option>`)
    }
    for (const banned of list.bannedList) {
        $('#bannedSelect').append(`<option value=\"${banned}\">${banned}</option>`)
    }
}

//проверка что все необходимые поля заполнены
function checkRequiredFields(){
    let fieldName = $("#nameInput").val();
    let fieldTitle = $("#titleInput").val();
    let fieldBirthday = $("#birthdaySelect").val();
    if (!fieldName || !fieldTitle || !fieldBirthday){
        alert("Enter valid data in all fields!");
        return false;
    }
    createPlayer();
}