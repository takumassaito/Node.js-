const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const qs = require('querystring');
const { kMaxLength } = require('buffer');

const index_page = fs.readFileSync('index.ejs','utf8');
const other_page = fs.readFileSync('other.ejs','utf8');
const style_css = fs.readFileSync('style.css', 'utf8');

const dataList = {
    'Taro': '09-999-999',
    'Hanako': '080-888-888',
    'Sachiko': '070-777-777',
    'Ichiro': '060-666-666',
};

const dataList2 = {
    'Taro': ['taro@yamada','09-999-999','Tokyo'],
    'Hanako': ['hanako@flower','080-888-888','Yokohama'],
    'Sachiko': ['sachi@happy','070-777-777','Nagoya'],
    'Ichiro': ['ichi@baseball','060-666-666', 'USA'],
};

let leftedMassage = { 'msg':"no massage..."};

let server = http.createServer(getFromClient);

server.listen(3000);
console.log("Server start!");





function getFromClient(request,response){
    const baseURL = 'http://' + request.headers.host + '/';
    const url_parts = new URL(request.url, baseURL);
    switch(url_parts.pathname){

        case '/':
            response_index(request,response);
            break;

        case '/other':
            response_other(request,response);
            break;

        // case '/style.css':
        // response.writeHead(200,{'Content-type': 'text/css'});
        // response.write(style_css);
        // response.end();
        // break;

        default:
            response.writeHead(200,{'Content-type': 'text/plain'});
            response.end('no page...');
            break;

    }
    }

function response_index(request,response){

    if(request.method == "POST"){
        let body = "";
        //伝言入力フォームから受け取ったクエリテキストをbodyに入れる
        request.on("data",(data) => {
            body += data;
        });

        request.on("end",() => {
            /*クエリテキストをパースするとオブジェクトがリターンされ
            {msg:""}の形でプロパティにパースされたクエリテキストが入っている
            */
            leftedMassage = qs.parse(body);

            setCookie('msg', leftedMassage.msg, response);
            write_index(request, response);
        });



}

else{
    write_index(request, response);
}


}

function response_other(request,response){
    let content = "Index massage"

    //request.methodプロパティはリクエストがどういう方式で送られてきたかを示す値　ex:POST,GET..
    if(request.method == 'POST'){
        let body = '';

        /*request(クライアントから送られてくるリクエストが入る).on(event, func)で
        特定のイベント発生時にfuncを実行させることができる。*/
        request.on('data',(data) =>{
            body += data;
        })

        request.on('end',() => {
            //qs.parseはURLではなく普通のテキストからクエリーテキストをパースするためのメソッド
            //URLからクエリーパラメーターをパースしたいならURL.searchParams.get()を使おう
            const post_data = qs.parse(body);

            //フォームで送信されたデータはフォームの'name='と結び付けられる　以下はname=msgを受け取っている
            content += ' you entered: ' + post_data.msg;

            let dataOther = ejs.render(other_page, {
                title: "Haven and hearth",
                content: content,
                data: dataList2,
                filename: 'data_items',
            });

            response.writeHead(200,{'Content-type': 'text/html'});
            response.write(dataOther);
            response.end();
        })

    }

    else{
        let dataOther = ejs.render(other_page, {
            title: "Haven and hearth",
            content: "getアクセス時の表示です",
            data: dataList2,
            filename: 'data_items',
        });

        response.writeHead(200,{'Content-type': 'text/html'});
        response.write(dataOther);
        response.end();
    }
}

function write_index(request, response){
    const msg = "伝言メッセージ";

    let cookie_data = getCookie('msg', request);

    const data = ejs.render(index_page,{
        title: "Index",
        data: leftedMassage,
        content: msg,
        cookie_data: cookie_data});

    response.writeHead(200,{'Content-type': 'text/html'});
    response.write(data);
    response.end();
}

function setCookie(key, value, response){
    //cookieがデータを保持できるようにvalueをescape()で16進数表現エスケープシーケンスで置き換える
    let cookie = escape(value);
    response.setHeader('Set-Cookie', [key + '=' + cookie]);
}

function getCookie(key, request){
    //request.headerプロパティにヘッダー情報が、header.cookieプロパティにクッキーテキストが保管されている
    let cookie_data = request.headers.cookie != undefined ? request.headers.cookie : "";
    
    //Cookieは実際にはkey=value;key=valueのような文字列で保存されるため";"でスプリットする
    const data = cookie_data.split(';');
    for(const i in data){
        /*string.trim()前後の空白を削除後文字列を返す　
        startsWith()引数で始まっているかどうかをチェックtrue/falseを返す*/
        if(data[i].trim().startsWith(key + '=')){
            let result = data[i].trim().replace(key + '=',"")
            return unescape(result);
        }
    }
    return '';
}