// HTML要素の取得
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const autoDownloadCb = document.getElementById('autoDownloadCb');

const timeDisplay = document.getElementById('timeDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const maxSpeedDisplay = document.getElementById('maxSpeedDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const countDisplay = document.getElementById('countDisplay');
const accuracyDisplay = document.getElementById('accuracyDisplay');

// 状態管理
let watchId = null;
let recordedData = [];
let maxSpeed = 0.0;

// 時計更新
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour12: false });
    timeDisplay.textContent = timeString;
    return timeString;
}
setInterval(updateClock, 1000);

// [記録開始] ボタン
startBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('お使いのブラウザはGPSに対応していません。');
        return;
    }

    startBtn.disabled = true;
    stopBtn.disabled = false;
    downloadBtn.disabled = true;
    clearBtn.disabled = true;
    statusDisplay.textContent = 'GPSを取得中...';

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const currentTime = updateClock();
            const speedMps = position.coords.speed || 0;
            const speedKmph = parseFloat((speedMps * 3.6).toFixed(1));

            // 最高速度の更新
            if (speedKmph > maxSpeed) {
                maxSpeed = speedKmph;
                maxSpeedDisplay.textContent = maxSpeed.toFixed(1);
            }

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            speedDisplay.textContent = speedKmph.toFixed(1);
            accuracyDisplay.textContent = Math.round(accuracy);
            statusDisplay.textContent = '記録中 (GPS受信OK)';

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
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
});

// [停止] ボタン
stopBtn.addEventListener('click', () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDisplay.textContent = '停止中';

    if (recordedData.length > 0) {
        downloadBtn.disabled = false;
        clearBtn.disabled = false;
        
        // 自動ダウンロードにチェックが入っていれば即実行
        if (autoDownloadCb.checked) {
            downloadCSV();
        }
    }
});

// [CSVダウンロード] ボタン
downloadBtn.addEventListener('click', () => {
    if (recordedData.length === 0) return;
    downloadCSV();
});

// [リセット] ボタン
clearBtn.addEventListener('click', () => {
    if (confirm('記録したデータをすべて消去して最初からやり直しますか？')) {
        recordedData = [];
        maxSpeed = 0.0;
        
        // UIの初期化
        speedDisplay.textContent = '0.0';
        maxSpeedDisplay.textContent = '0.0';
        countDisplay.textContent = '0';
        accuracyDisplay.textContent = '-';
        statusDisplay.textContent = '待機中';
        
        downloadBtn.disabled = true;
        clearBtn.disabled = true;
    }
});

// CSV出力処理
function downloadCSV() {
    let csvContent = "time,speed_kmh,latitude,longitude\n";
    recordedData.forEach(row => {
        csvContent += `${row.time},${row.speed},${row.lat},${row.lon}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `train_speed_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
