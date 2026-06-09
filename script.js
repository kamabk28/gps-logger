const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const timeDisplay = document.getElementById('timeDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const countDisplay = document.getElementById('countDisplay');
const accuracyDisplay = document.getElementById('accuracyDisplay');

let watchId = null;
let recordedData = [];

// 時計を1秒ごとに更新する関数
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour12: false });
    timeDisplay.textContent = timeString;
    return timeString; // 記録用にも返す
}
setInterval(updateClock, 1000);

// 「記録開始」ボタンを押したときの処理
startBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('お使いのブラウザはGPSに対応していません。');
        return;
    }

    recordedData = [];
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDisplay.textContent = 'GPSを取得中...';
    countDisplay.textContent = '0';

    // GPSの連続取得を開始
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const currentTime = updateClock();

            // position.coords.speed は メートル/秒 なので、km/hに変換 (3.6を掛ける)
            // 止まっているとnullになることがあるので、その場合は0にする
            const speedMps = position.coords.speed || 0;
            const speedKmph = (speedMps * 3.6).toFixed(1); // 小数点第1位まで

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy; // 誤差(メートル)

            // 画面の更新
            speedDisplay.textContent = speedKmph;
            accuracyDisplay.textContent = Math.round(accuracy);
            statusDisplay.textContent = '記録中';

            // メモリにデータを保存
            recordedData.push({
                time: currentTime,
                speed: speedKmph,
                lat: lat,
                lon: lon
            });

            countDisplay.textContent = recordedData.length;
        },
        (error) => {
            console.error(error);
            statusDisplay.textContent = `エラー: ${error.message}`;
        },
        {
            enableHighAccuracy: true, // スマホのGPSをフルパワーで使う設定
            maximumAge: 0,
            timeout: 5000
        }
    );
});

// 「停止＆CSV保存」ボタンを押したときの処理
stopBtn.addEventListener('click', () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId); // GPSの取得を止める
        watchId = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDisplay.textContent = '待機中';

    if (recordedData.length === 0) {
        alert('記録されたデータがありません。');
        return;
    }

    downloadCSV();
});

// CSVをダウンロードする関数
function downloadCSV() {
    // 1行目のヘッダー（項目名）
    let csvContent = "time,speed_kmh,latitude,longitude\n";

    // データをカンマ区切りの文字列にして追加
    recordedData.forEach(row => {
        csvContent += `${row.time},${row.speed},${row.lat},${row.lon}\n`;
    });

    // 文字化け対策（BOMを付ける）してBlob化
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

    // ダウンロード用のリンクを裏で作ってクリックさせる
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `train_speed_${new Date().getTime()}.csv`; // ファイル名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
