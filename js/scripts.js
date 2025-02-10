

// data initialization ========================================================

// 전역 변수 선언
let circuit_data; //  
let user_data; // 
const ui_data = {'is_plot_clicked': true,
                'selected_element': null,
}; // 상태 저장 변수


let pixelsPerUnit = 30; // 1 단위당 픽셀 길이
const MIN_PIXELS_PER_UNIT = 1; // 최소 1 단위당 5px
const MAX_PIXELS_PER_UNIT = 100; // 최대 1 단위당 100px
const PLOT_RANGE_LIMIT = 200; // x, y축 범위 제한: -50 ~ 50

async function fetchCircuitData() {
    try {
        const response = await fetch('/initialization', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        });

        // 응답을 JSON으로 파싱
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        circuit_data = data.received
        console.log("Circuit data received:", circuit_data);
    } catch (error) {
        console.error("Error during POST request:", error);
    }
}
fetchCircuitData()


// ===============================================================================================================================
// Plot Initialization ===========================================================================================================
// ===============================================================================================================================

// layout
const layout = {
        // 1. 플롯의 제목을 없애고, 툴바를 숨김
        title: '',
        showlegend: false,
        dragmode: false, // 드래그 모드 비활성화
        hovermode: false, // hover 모드 비활성화 (옵션)

        // 2. x, y축 비율을 1:1로 설정
        xaxis: {
            scaleanchor: 'y', // y축과 비율 고정
            scaleratio: 1, // x축: y축 비율 1:1
            showgrid: false, // 그리드 활성화
            dtick: 1, // x축 틱 간격 1
            zeroline: false, // 축선 숨김
            showticklabels: false, // 틱 라벨 숨김
            range: [-10,10], // x축 범위 설정
            title: '' // 라벨 숨김
        },
        yaxis: {
            showgrid: false, // 그리드 활성화
            dtick: 1, // x축 틱 간격 1
            zeroline: false, // 축선 숨김
            showticklabels: false, // 틱 라벨 숨김
            range: [-10,10], // y축 범위 설정
            title: '' // 라벨 숨김
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }, // 여백 제거
    };
const config = {
    displayModeBar: false, // 툴바 숨김
};

// gridlines & boundary
const lims = PLOT_RANGE_LIMIT*0.8;
const x_grid = [];
const y_grid = [];
for (let a = -lims; a <= lims; a+=2) {
    x_grid.push(a, a, NaN, -lims, lims, NaN);
    y_grid.push(-lims, lims, NaN, a, a, NaN);
}
const gridline = {
    x: x_grid, // x축 범위
    y: y_grid,    // y축 고정
    mode: 'lines',
    line: { color: 'rgb(230,230,230)', width: 0.5,}, // 점선 스타일
    name: 'gridline'
};

const gridline_boundary = {
    x: [-lims,lims,lims,-lims,-lims], // x축 범위
    y: [-lims,-lims,lims,lims,-lims],    // y축 고정
    mode: 'lines',
    line: { color: 'rgb(130,130,130)', width: 1,}, // 점선 스타일
    name: 'gridline-boundary'
};


// dataline
const dataline = {
    x: [], // x 데이터
    y: [],  // y 데이터
    mode: 'lines',
    line: { color: 'rgb(40,40,40)', width: 1.5 }, // 실선 스타일
    marker: { size: 10, color: 'blue' }, // 마커 크기와 색상
    name: 'dataline'
};

// hoverline
const lineobj_hover = {
    x: [], // 초기 x 데이터 (비어 있음)
    y: [], // 초기 y 데이터 (비어 있음)
    mode: 'lines',
    line: { color: 'rgb(190,190,190)', width: 1.5, dash: 'solid' }, // 스타일 정의
    name: 'hoverline',
    hoverinfo: 'none' // hover 정보 표시 안 함
};

// Plot 데이터 배열
const data = [gridline, gridline_boundary, dataline, lineobj_hover];

// Plotly 그래프 생성 (기본 레이아웃)
Plotly.newPlot('canvas', data, layout, config);
let plotElement = document.getElementById('canvas');
fun_resize_plot()



// ===============================================================================================================================
// UIUX Functions ================================================================================================================
// ===============================================================================================================================

// hidden panel toggle ========================================================
function fun_toggle_hidden(clickedid) {

    const clicked_element = document.getElementById(clickedid);
    const target_element = document.getElementById(clickedid.replace('btn','opt'));
    const is_hidden = target_element.classList.contains('hidden')
    
    if (is_hidden) {
        target_element.classList.remove('hidden');
        clicked_element.classList.add('btn-clicked');
    } else {
        target_element.classList.add('hidden');
        clicked_element.classList.remove('btn-clicked');
    }
    fun_resize_plot()
}



// document.getElementById('canvas').addEventListener('click', () => {
//     ui_data['is_plot_clicked'] = true;
//     plotElement.classList.add('container-clicked');
// });
// // Plot 외부 클릭 시 상태 업데이트
// document.addEventListener('click', (event) => {
//     if (!plotElement.contains(event.target)) {
//         ui_data['is_plot_clicked'] = false;
//         plotElement.classList.remove('container-clicked');
//     }
// });


// resize ========================================================
// window resize event : plot resizing
window.addEventListener('resize', () => { fun_resize_plot() });
function fun_resize_plot() {
    const width_left = 80;
    const width_right = 200;
    const actualWidth = window.innerWidth / window.devicePixelRatio;
    const actualHeight = window.innerHeight ;
    const count_right = 4 - document.querySelectorAll('.hidden').length;
    const height_top_offset = document.querySelector('.container-title').offsetHeight;
    plotElement.style.width = `${actualWidth - width_left - width_right*count_right}px`;
    plotElement.style.height = `${actualHeight - height_top_offset - 50}px`;
    sub_plot_reaxis(plotElement.offsetWidth - 20,plotElement.offsetHeight - 20,'size');
    sub_rerangeCanvas();
    return
}

function sub_rerangeCanvas() {
    // 플롯의 실제 크기 가져오기
    
    const plot = plotElement._fullLayout;
    const width = plot.width;  // 플롯 내부 너비
    const height = plot.height; // 플롯 내부 높이

    // 현재 X, Y축의 범위 가져오기
    const currentLayout = plotElement.layout;
    const currentXRange = currentLayout.xaxis.range; // [xmin, xmax]
    const currentYRange = currentLayout.yaxis.range; // [ymin, ymax]

    // 현재 중심 계산
    const xCenter = (currentXRange[0] + currentXRange[1]) / 2;
    const yCenter = (currentYRange[0] + currentYRange[1]) / 2;

    // 새로운 X, Y축 범위 계산 (중심 기준)
    const xRange = width / pixelsPerUnit / 2;
    const yRange = height / pixelsPerUnit / 2;

    const newXRange = [
        Math.max(xCenter - xRange, -PLOT_RANGE_LIMIT),
        Math.min(xCenter + xRange, PLOT_RANGE_LIMIT)
    ];
    const newYRange = [
        Math.max(yCenter - yRange, -PLOT_RANGE_LIMIT),
        Math.min(yCenter + yRange, PLOT_RANGE_LIMIT)
    ];

    // Plotly의 축 범위 업데이트
    sub_plot_reaxis(newXRange,newYRange,'range');
}

// 키보드 이벤트 핸들러
const step = 30; // 이동 간격
window.addEventListener('keydown', (event) => { 
    if (!plotElement || !plotElement.layout) return;

    const currentXRange = plotElement.layout.xaxis.range;
    const currentYRange = plotElement.layout.yaxis.range;

    let newXRange = [...currentXRange];
    let newYRange = [...currentYRange];

    let keystep = step / pixelsPerUnit;

    switch (event.key) {
        case 'ArrowLeft': // 왼쪽 방향키
            newXRange = [
                Math.max(currentXRange[0] - keystep, -PLOT_RANGE_LIMIT),
                Math.max(currentXRange[1] - keystep, -PLOT_RANGE_LIMIT),
            ];
            break;
        case 'ArrowRight': // 오른쪽 방향키
            newXRange = [
                Math.min(currentXRange[0] + keystep, PLOT_RANGE_LIMIT),
                Math.min(currentXRange[1] + keystep, PLOT_RANGE_LIMIT),
            ];
            break;
        case 'ArrowUp': // 위쪽 방향키
            newYRange = [
                Math.min(currentYRange[0] + keystep, PLOT_RANGE_LIMIT),
                Math.min(currentYRange[1] + keystep, PLOT_RANGE_LIMIT),
            ];
            break;
        case 'ArrowDown': // 아래쪽 방향키
            newYRange = [
                Math.max(currentYRange[0] - keystep, -PLOT_RANGE_LIMIT),
                Math.max(currentYRange[1] - keystep, -PLOT_RANGE_LIMIT),
            ];
            break;
        default:
            return; // 다른 키는 무시
    }

    // X, Y축 범위 업데이트
    sub_plot_reaxis(newXRange,newYRange,'range');
});


// 마우스 휠 이벤트 핸들러
plotElement.addEventListener('wheel', (event) => {
    event.preventDefault(); // 기본 스크롤 방지

    // 플롯 크기 및 현재 범위 가져오기
    const plot = plotElement._fullLayout;
    const width = plot.width;
    const height = plot.height;

    const currentXRange = plot.xaxis.range; // [xmin, xmax]
    const currentYRange = plot.yaxis.range; // [ymin, ymax]

    const xRangeSize = currentXRange[1] - currentXRange[0];
    const yRangeSize = currentYRange[1] - currentYRange[0];

    // 마우스 위치를 그래프 좌표로 변환
    const mouseX = (event.offsetX / width) * xRangeSize + currentXRange[0];
    const mouseY = (1 - event.offsetY / height) * yRangeSize + currentYRange[0];

    // 줌 인/아웃 스케일 조정
    const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1; // 줌인(스크롤 위): 0.9, 줌아웃(스크롤 아래): 1.1
    const newPixelsPerUnit = pixelsPerUnit / zoomFactor;
    if (newPixelsPerUnit < MIN_PIXELS_PER_UNIT) {
        pixelsPerUnit = MIN_PIXELS_PER_UNIT
    } else if (newPixelsPerUnit > MAX_PIXELS_PER_UNIT) {
        pixelsPerUnit = MAX_PIXELS_PER_UNIT
    } else {
        pixelsPerUnit = newPixelsPerUnit;
    }

    // 새로운 범위 계산
    const newXRange = [
        Math.max(mouseX - (mouseX - currentXRange[0]) * zoomFactor, -PLOT_RANGE_LIMIT),
        Math.min(mouseX + (currentXRange[1] - mouseX) * zoomFactor, PLOT_RANGE_LIMIT)
    ];
    const newYRange = [
        Math.max(mouseY - (mouseY - currentYRange[0]) * zoomFactor, -PLOT_RANGE_LIMIT),
        Math.min(mouseY + (currentYRange[1] - mouseY) * zoomFactor, PLOT_RANGE_LIMIT)
    ];
    // 범위 업데이트
    sub_plot_reaxis(newXRange,newYRange,'range');
});


function sub_plot_reaxis(xdata,ydata,opt) {
    if (opt == 'range') {
        Plotly.relayout('canvas', {
            'xaxis.range': xdata,
            'yaxis.range': ydata
        });
    } else if (opt == 'size') {
        Plotly.relayout('canvas', {
            width: xdata,
            height: ydata,
        });

    }
}




// ===============================================================================================================================
// ELEMENT CONTROL Functions =====================================================================================================
// ===============================================================================================================================


// 요소 선택 (클릭)
document.querySelectorAll('.div-element').forEach((element) => {
    element.addEventListener('click', () => {
        // 클릭된 요소의 id로 ui_data 상태 업데이트
        const elementId = element.id;
        ui_data['selected_element'] = elementId.replace('btn-','xy_');
        console.log(ui_data['selected_element'])
        console.log( circuit_data['shapeset'])
        ui_data['selected_element_xy'] = circuit_data['shapeset'][ui_data['selected_element']]

        // 기존의 clicked-element 클래스 제거
        document.querySelectorAll('.div-element.btn-clicked').forEach((el) => {
            el.classList.remove('btn-clicked');
        });

        // 클릭된 요소에 clicked-element 클래스 추가
        element.classList.add('btn-clicked');

        console.log('Selected element:', ui_data['selected_element']); // 디버깅용
    });
});


// Esc 입력
window.addEventListener('keydown', (event) => {
    if (event.key=='Escape') {
        document.querySelectorAll('.div-element.btn-clicked').forEach((el) => {
            el.classList.remove('btn-clicked');
        });
        ui_data['selected_element'] = null;
        ui_data['selected_element_xy'] = null;
        targetIndex = data.findIndex(trace => trace.name === 'hoverline')
        Plotly.restyle('canvas', { x: [null], y: [null] }, targetIndex);

    } 
});


// Canvas에서 마우스 포인터의 위치를 읽고 shape 업데이트
document.getElementById('canvas').addEventListener('mousemove', (event) => {
    if (!ui_data['selected_element']) return; // 선택된 element가 없으면 동작하지 않음

    const shape = ui_data['selected_element_xy'];
    if (shape) {
        const [hoverX,hoverY] = sub_shapeToXY(shape, event)
        targetIndex = data.findIndex(trace => trace.name === 'hoverline')
        Plotly.restyle('canvas', { x: [hoverX], y: [hoverY] }, targetIndex);
    }
});



// element 추가
document.getElementById('canvas').addEventListener('click', (event) => {
    if (!ui_data['selected_element']) return; // 선택된 element가 없으면 동작하지 않음
    const shape = ui_data['selected_element_xy'];
    if (shape) {
        targetIndex = data.findIndex(trace => trace.name === 'dataline')
        const currentX = plotElement.data[targetIndex].x; // 기존 x 데이터
        const currentY = plotElement.data[targetIndex].y; // 기존 y 데이터

        const [compX,compY] = sub_shapeToXY(shape, event)
        const updatedX = currentX.concat(compX);
        const updatedY = currentY.concat(compY);

        // 데이터 업데이트
        Plotly.restyle('canvas', { x: [updatedX], y: [updatedY] }, targetIndex);
    }

});


// Utils ===================================================================================================================


function sub_round(pnt, deg = 2) {
    return Math.round((pnt - 1) / deg) * deg + deg; // deg 기본값 설정 (기본값은 1)
}


function sub_shapeToXY(shape, event) {

    // Plot의 현재 레이아웃 가져오기
    const plotLayout = plotElement._fullLayout;

    // 마우스 좌표를 그래프 좌표로 변환
    const mouseX = sub_round(
        plotLayout.xaxis.range[0] + (event.offsetX / plotLayout.width) * (plotLayout.xaxis.range[1] - plotLayout.xaxis.range[0]) - 1,
    );
    const mouseY = sub_round(
        plotLayout.yaxis.range[1] - (event.offsetY / plotLayout.height) * (plotLayout.yaxis.range[1] - plotLayout.yaxis.range[0]) - 1,
    );

    const [shapeX, shapeY] = shape;
        
    // 마우스 위치에 shape 데이터를 더한 결과 계산
    const Xdata = shapeX.map((val) => val === null ? null : val + mouseX);
    const Ydata = shapeY.map((val) => val === null ? null : val + mouseY);

    return [Xdata, Ydata]

}