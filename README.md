# Thread.js
## ```Thread```クラス
|メンバ|引数|返り値||
|---|---|---|---|
|```constructor()```|**```fn```** : 新しいスレッドで実行する```Function```<br>**```g?```** : ```fn```のスコープ内で使用する外部変数からなる```Object```<br>**```scripts?```** :インポートするスクリプトの```Array```|```Thread```|新規スレッドを作成する。```fn```内で```invoke()```を使用することでメインスレッドで処理する関数を指定できる。|
|```Thread#bind()```|```...```|```Thread```|```Thread#start()```または```Thread#execute()```の引数を可変個引数により予め指定する。```Thread.any()```や```Thread.all()```は内部で```Thread#start()```を呼び出すのでこれらの関数を使用するときに用いる。|
|```Thread#start()```|```...```|```Promise```|スレッドを一度だけ実行し、終了後即破棄する。可変個引数で```constructor```の```fn```の引数を指定する。|
|```Thread#execute()```|```...```|```Promise```|スレッドを実行し、次の呼び出しを待機する。終了後は自動的に破棄されない。可変個引数で```constructor()```の```fn```の引数を指定する。次の呼び出しで```Thread#start()```使うこともできる。|
|```Thread#terminate()```|なし|なし|スレッドを終了|
|```Thread.wait()```|**```ms```** : 待機時間[ms]|```Promise```|指定時間待機する
|```Thread.any()```|```Thread```の```Array```|```Promise```|マルチスレッド処理する```Thread```が一つでも終了したときに、その値とともに```Promise```を返す|
|```Thread.all()```|```Thread```の```Array```|```Promise```|マルチスレッド処理する```Thread```がすべて終了したときに、その値の```Array```とともに```Promise```を返す|
|```Thread.create()```|**```num```** :生成するスレッドの数<br>**```fn```** : 新しいスレッドで実行する```Function```<br>**```g?```** : ```fn```のスコープ内で使用する外部変数からなる```Object```<br>**```scripts?```** :インポートするスクリプトの```Array```|```Thread```の```Array```|同じ関数を実行するスレッドを複数作成する。|
|```Thread#url```|-|```String```|新規スレッドのコードURL|
|```Thread#worker```|-|```Worker```|作成された```Worker```オブジェクト|
|**コンストラクタの```fn```内**|
|```invoke()```|**```fn```** : メインスレッドで実行する```Function```<br>**```g?```** : ```fn```のスコープ内で使用する外部変数からなる```Object```|```Promise```|メインスレッドで処理する関数を指定する|

## ```Ajax```クラス
言わずもがな。jQueryとほとんど一緒。
|メンバ|引数|返り値|
|---|---|---|
|```Ajax.request()```|||
|```Ajax.get()```|||
|```Ajax.getJson()```|||
## 例
``` js
(async () => {



    var timer = new Timer();
    //async function内

    var thread0 = new Thread(async (e, i) => {
        var timer = new Timer(e);
        console.log(i + ' :hello ' + e);
        timer.end();
    }, {}, ['./scripts/timer.js']);
    await thread0.execute('sho', 0);
    // hello sho
    await thread0.execute('sato', 1);
    // hello sato
    thread0.terminate();
    // 明示的に終了する必要がある


    var thread00 = new Thread(async (url, i) => {
        var data = await Ajax.request({
            type: 'get',
            url,
        });
        console.log(i + ' :' + data.length);
    }, {});
    await thread00.execute('./scripts/thread.js', 2);
    await thread00.start('./scripts/util.js', 3);



    var num = 9;
    var obj = {
        name: 'shosato',
        age: '19',
    };
    var add = (a, b) => {
        return a + b;
    };

    var thread1 = new Thread(function (a, b) {
        console.log('4 :' + num);
        // expected output: 9
        console.log('5 :' + obj.name);
        // expected output: shosato
        console.log('6 :' + add(1, 2));
        // 3
        console.log('7 :' + a * b);
        // 45
        return obj.age;
    }, {
        add,
        num,
        obj
    }); // you need to insert variables used in function

    var result = await thread1.start(5, 9);
    console.log('8 :' + result);
    // 19



    var thread2 = new Thread(async function () {
        var result = await invoke(function () {
            console.log('9 :' + 'this function was executed in main thread.')
            var e = document.createElement('p');
            e.textContent = obj.name;
            e.id = 'id'
            document.querySelector('body').appendChild(e);
            return document.getElementById('id').textContent;
        }, {
            obj
        }); // you need to insert variables used in function
        console.log('10 :' + 'after invoked function and created element.')
        return result;
    }, {
        obj
    }); // you need to insert variables used in function

    var thread3 = new Thread(async function () {
        await Thread.wait(1000);
        console.log('11 :' + 'after one second.');
        return 'wait';
    });

    var all = await Thread.all([thread2, thread3]);
    console.log('12 :' + JSON.stringify(all));
    // expected output: ["shosato","wait"]



    var thread4 = new Thread(async function (m) {
        await Thread.wait(m);
        return m;
    });

    var thread5 = new Thread(async function () {
        await Thread.wait(2000);
        return 2000;
    });

    var any = await Thread.any([thread4.bind(1000), thread5]);
    console.log('13 :' + any);
    // expected output: 1000
    timer.end();
})();
```