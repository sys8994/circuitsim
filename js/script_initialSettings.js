// prjManager Object =============================================================================================================
// ===============================================================================================================================

// prjManager object for state and logic management
const prjManager = {

    // properties =================================================================
    circuitData:null,
    plotObject: {
        canvas: document.getElementById("canvas"),
        Plotly: Plotly,
    },
    mode: 'normal', // Initial mode
    data: {
        counter: 0,
        element: {}, // circuit elements 
        xymap: {}, // XY ID to element mapping
    },
    uiStatus: {
        dragClicked: false, // Indicates whether the mouse is clicked
        clickedPoint1: [], // Stores the starting point of the drag
        clickedPoint2: [], // Stores the ending point of the drag
        hoverPoint: [], // element hover x,y points
    },
    createElement: {
        name: null,
        shape: null,
        shapeN: null,
        polarity: 0,
        nRotation: 0,
    },
    canvasSizeVar: {
        pixelsPerUnit: 30, // 1 단위당 픽셀 길이
        minPixelsPerUnit: 1, // 최소 1 단위당 5px
        maxPixelsPerUnit: 100, // 최대 1 단위당 100px
        canvasRangeLimit: [0,300,-50,350], // x, y range limit
        arrowKeyStep: 30, // arrow key step size
    },

    // methods ====================================================================
    // Dictionary-style event handlers
    handlers: {
        normal: {
            mousedown: (event) => {
                if (prjManager.plotObject.canvas.contains(event.target)) {canvasDrag(event, prjManager, opt='down')}
                else if (event.target.classList.contains('div-element')) { selectElement(event, prjManager) }
                else if (event.target.classList.contains('div-option')) { selectOption(event, prjManager) }
            },                
            mousemove: (event) => {
                if (prjManager.uiStatus.dragClicked) { canvasDrag(event, prjManager, opt='move') }
            },
            mouseup: (event) => {
                if (prjManager.uiStatus.dragClicked) { canvasDrag(event, prjManager, opt='up') }
            },                
            keydown: (event) => {
                if (event.ctrlKey) { 
                    if (event.key === 'c' || event.key === 'x') { copyElement(event,prjManager) } 
                    else if (event.key === 'v') { pasteElement(event,prjManager) } 
                    else if (event.key === 's') { saveProject(event,prjManager) } 
                }
                else if (event.key === 'delete') { deleteElement(event,prjManager) }
                else if (['1','2','3','4','5','6','7','8','9','0','t'].includes(event.key)) { selectElement(event, prjManager) } // element selection
                else if (['F1','F2','F3','F4'].includes(event.key)) { selectOption(event, prjManager) } // element selection
                else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { canvasMove(event, prjManager) } // element selection
            },
            wheel: (event) => canvasWheel(event, prjManager),
            resize: (event) => canvasResize(event, prjManager),
        },
        create: {
            mousedown: (event) => {
                if (prjManager.plotObject.canvas.contains(event.target)) {createElement(event, prjManager)}
                else if (event.target.classList.contains('div-element')) { selectElement(event, prjManager) }
                else if (event.target.classList.contains('div-option')) { selectOption(event, prjManager) }
            },               
            mousemove: (event) => hoverElement(event, prjManager),
            keydown: (event) => {
                if (event.ctrlKey) { 
                    if (event.key === 's') { saveProject(event,prjManager) } 
                }
                else if (event.key === 'r') { rotateElement(event,prjManager) }
                else if (event.key === 's') { switchElement(event,prjManager) }
                else if (event.key === 'escape') { resetMode(event,prjManager) }
                else if (['1','2','3','4','5','6','7','8','9','0','t'].includes(event.key)) { selectElement(event, prjManager) } // element selection
                else if (['F1','F2','F3','F4'].includes(event.key)) { selectOption(event, prjManager) } // element selection
                else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { canvasMove(event, prjManager) } // element selection
            },
            wheel: (event) => canvasWheel(event, prjManager),
            resize: (event) => canvasResize(event, prjManager),
        },
        disable: {
            default: (event) => {
                console.log(`Disable mode: ${event.type} event ignored`);
            },
        },
    },

    // Changes the current mode
    setMode(newMode) {
        if (this.handlers[newMode]) {
            console.log(`Mode changed to: ${newMode}`);
            this.mode = newMode;
        } else {
            console.error(`Invalid mode: ${newMode}`);
        }
    },

    resetUiStatus() {        
        this.uiStatus= {
                dragClicked: false, // Indicates whether the mouse is clicked
                clickedPoint1: [], // Stores the starting point of the drag
                clickedPoint2: [], // Stores the ending point of the drag
                hoverPoint: [], // element hover x,y points
            }
    },

    // Handles events based on the current mode and type
    handleEvent(event) {
        const modeHandlers = this.handlers[this.mode];
        const handler = modeHandlers[event.type];
        if (handler) {
            handler(event);
        } else {
            console.warn(`No handler for event type: ${event.type} in mode: ${this.mode}`);
        }
    },
};

// Initialization ================================================================================================================
// ===============================================================================================================================

// List of event types to observe
const observedEvents = ["mousemove", "mousedown", "mouseup", "keydown", "wheel"];
// Add event listeners to the document
observedEvents.forEach((eventType) => {
    document.addEventListener(eventType, (event) => prjManager.handleEvent(event));
});
window.addEventListener("resize", (event) => prjManager.handleEvent(event)); // resize

function fetchCircuitData() {
    fetch('https://raw.githubusercontent.com/sys8994/circuitsim/master/data.json')
    .then(response => response.json())
    .then(data => {
        prjManager.circuitData = data
        console.log('circuitData:',prjManager.circuitData)
    })
    .catch(error => console.error('Error loading JSON:', error));
}
fetchCircuitData()


// plot objects initialization ===================================================================================================
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
        range: [-10, 10], // x축 범위 설정
        title: '' // 라벨 숨김
    },
    yaxis: {
        showgrid: false, // 그리드 활성화
        dtick: 1, // x축 틱 간격 1
        zeroline: false, // 축선 숨김
        showticklabels: false, // 틱 라벨 숨김
        range: [-10, 10], // y축 범위 설정
        title: '' // 라벨 숨김
    },
    margin: { l: 0, r: 0, t: 0, b: 0 }, // 여백 제거
};
const config = {
    displayModeBar: false, // 툴바 숨김
};

// gridlines & boundary
const lims0 = prjManager.canvasSizeVar.canvasRangeLimit[0];
const lims1 = prjManager.canvasSizeVar.canvasRangeLimit[1];
const x_grid = [];
const y_grid = [];
for (let a = lims0; a <= lims1; a += 2) {
    x_grid.push(a, a, NaN, lims0, lims1, NaN);
    y_grid.push(lims0, lims1, NaN, a, a, NaN);
}
const lineObj_grid = {
    x: x_grid, // x축 범위
    y: y_grid,    // y축 고정
    mode: 'lines',
    line: { color: 'rgb(230,230,230)', width: 0.5, }, // 점선 스타일
    name: 'lineObj_grid'
};

const lineObj_gridBoundary = {
    x: [lims0, lims1, lims1, lims0, lims0], // x축 범위
    y: [lims0, lims0, lims1, lims1, lims0],    // y축 고정
    mode: 'lines',
    line: { color: 'rgb(130,130,130)', width: 1, }, // 점선 스타일
    name: 'lineObj_gridBoundary'
};

// element selected
const lineObj_elementSelect = {
    x: [],
    y: [],
    mode: 'lines',
    line: { color: 'rgb(28, 0, 213)', width: 3.0 },
    marker: { size: 10, color: 'blue' },
    name: 'lineObj_elementSelect'
};

// element normal
const lineObj_elementNormal = {
    x: [],
    y: [],
    mode: 'lines',
    line: { color: 'rgb(40,40,40)', width: 1.5 },
    marker: { size: 10, color: 'blue' },
    name: 'lineObj_elementNormal'
};

// element with error
const lineObj_elementError = {
    x: [],
    y: [],
    mode: 'lines',
    line: { color: 'rgb(228, 7, 51)', width: 2.0 },
    marker: { size: 10, color: 'blue' },
    name: 'lineObj_elementError'
};

// element with no paramaters
const lineObj_elementNopara = {
    x: [],
    y: [],
    mode: 'lines',
    line: { color: 'rgb(228, 167, 0)', width: 1.5 },
    marker: { size: 10, color: 'blue' },
    name: 'lineObj_elementNopara'
};

// element with mouse hover
const lineObj_elementHover = {
    x: [],
    y: [],
    mode: 'lines',
    line: { color: 'rgb(90, 152, 146)', width: 1.5 },
    marker: { size: 10, color: 'blue' },
    name: 'lineObj_elementHover'
};

// hover
const lineObj_elementCreateNormal = {
    x: [], // 초기 x 데이터 (비어 있음)
    y: [], // 초기 y 데이터 (비어 있음)
    mode: 'lines',
    line: { color: 'rgb(190,190,190)', width: 1.2, dash: 'solid' }, // 스타일 정의
    name: 'lineObj_elementCreateNormal',
    hoverinfo: 'none'
};

// drag
const lineObj_drag = {
    type: "scatter",
    mode: 'lines',
    x: [], 
    y: [], 
    fill: "toself", // filling inner area
    fillcolor: "rgba(216, 216, 216, 0.5)", 
    line: { color: "rgba(112, 112, 112, 0.5)", width:0.5},
    name: 'lineObj_drag',
    hoverinfo: 'none', 
  };

// Plot data list
const data = [lineObj_grid, lineObj_gridBoundary, lineObj_elementSelect, lineObj_elementNormal, lineObj_elementError, lineObj_elementNopara, lineObj_elementHover, lineObj_elementCreateNormal, lineObj_drag];

// plotly initialization
function initiatePlotly(data, layout, config, prjManager) {
    const { canvas, Plotly } = prjManager.plotObject; // Access Plotly and canvas via prjManager.plotObject

    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    Plotly.newPlot(canvas, data, layout, config);
    Plotly.relayout('canvas', {
        'xaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
        'yaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
    });
    console.log("Plot created on canvas");
}
initiatePlotly(data, layout, config, prjManager)

canvasResize([],prjManager)
