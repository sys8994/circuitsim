// prjManager Object =============================================================================================================
// ===============================================================================================================================

// prjManager object for state and logic management
const prjManager = {

    // properties =================================================================
    circuitData:null,
    plotObject: {
        canvas: document.getElementById("canvas"),
        Plotly: Plotly,
        lineData: [],
        lineDataMap: {},
    },
    mode: 'normal', // Initial mode
    data: {
        counter: 0,
        elements: {}, // circuit elements 
        typeMap: {}, // pos ID to element type mapping
    },
    tempData: {
        counter: 0,
        elements: {}, // circuit elements 
        typeMap: {}, // pos ID to element type mapping
        hoverShape: [],
        nodeInfo: {},
        isValid: true,
        overlappedIdList: [],
        currentMode: 'element',
    },
    uiStatus: {
        currentXY: [], // mouse position
        dragClicked: false, // Indicates whether the mouse is clicked
        clickedPoint1: [], // Stores the starting point of the drag
        clickedPoint2: [], // Stores the ending point of the drag
        hoverPoint: [], // element hover x,y points (discrete)
        hoverPointContinuous: [], // element hover x,y points (continuous)
        isCtrl: false, // ctrl key pressed
    },
    // createElement: {
    //     name: null,
    //     polarity: 0,
    //     rotation: 0,
    //     shape: null,
    //     shapeN: null,
    //     terminal: null,
    //     isValid: true,
    //     node: null,
    //     hoverShape: [],
    //     typeMap: {},
    // },
    canvasProperty: {
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
                if (prjManager.uiStatus.dragClicked) { 
                    prjManager.uiStatus.currentXY = [event.clientX, event.clientY];
                    canvasDrag(event, prjManager, opt='move') 
                }
            },
            mouseup: (event) => {
                if (prjManager.uiStatus.dragClicked) { canvasDrag(event, prjManager, opt='up') }
            },                
            keydown: (event) => {
                if (event.ctrlKey && !prjManager.uiStatus.isCtrl) { 
                    setCtrlStatus(event, prjManager,'press');
                    if (event.key === 'c' || event.key === 'x') { copyElement(event,prjManager) } 
                    else if (event.key === 'v') { pasteElement(event,prjManager) } 
                    else if (event.key === 's') { saveProject(event,prjManager) } 
                }
                else if (event.key === 'delete') { deleteElement(event,prjManager) }
                else if (['1','2','3','4','5','6','7','8','9','0','t'].includes(event.key)) { selectElement(event, prjManager) } // element selection
                else if (['F1','F2','F3','F4'].includes(event.key)) { selectOption(event, prjManager) } // element selection
                else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { canvasMove(event, prjManager) } // element selection
            },
            keyup: (event) => {
                if (event.key === "Control" && prjManager.uiStatus.isCtrl) setCtrlStatus(event, prjManager,'release');
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
            mousemove: (event) => {                
                prjManager.uiStatus.currentXY = [event.clientX, event.clientY];
                hoverElement(prjManager, isRendering=false)
            },
            keydown: (event) => {
                if (event.ctrlKey && !prjManager.uiStatus.isCtrl) { 
                    setCtrlStatus(event, prjManager,'press');
                    if (event.key === 's') { saveProject(event,prjManager) } 
                }
                else if (event.key === 'r') { rotateElement(event,prjManager) }
                else if (event.key === 'f') { flipElement(event,prjManager) }
                else if (event.key === 'Escape') { resetMode(event,prjManager) }
                else if (['1','2','3','4','5','6','7','8','9','0','t'].includes(event.key)) { selectElement(event, prjManager) } // element selection
                else if (['F1','F2','F3','F4'].includes(event.key)) { selectOption(event, prjManager) } // element selection
                else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { canvasMove(event, prjManager) } // element selection
            },
            keyup: (event) => {
                if (event.key === "Control" && prjManager.uiStatus.isCtrl) setCtrlStatus(event, prjManager,'release');
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
            currentXY: [], // mouse position
            dragClicked: false, // Indicates whether the mouse is clicked
            clickedPoint1: [], // Stores the starting point of the drag
            clickedPoint2: [], // Stores the ending point of the drag
            hoverPoint: [], // element hover x,y points (discrete)
            hoverPointContinuous: [], // element hover x,y points (continuous)
            isCtrl: false, // ctrl key pressed
        };
    },

    resetTempData() {        
        this.tempData= {
            counter: 0,
            elements: {}, // circuit elements 
            typeMap: {}, // pos ID to element type mapping
            hoverShape: [],
            nodeInfo: {},
            isValid: true,
            overlappedIdList: [],
            currentMode: 'element',
        };
    },

    // Handles events based on the current mode and type
    handleEvent(event) {
        const modeHandlers = this.handlers[this.mode];
        const handler = modeHandlers[event.type];
        if (handler) {
            handler(event);
        } else {
            // console.warn(`No handler for event type: ${event.type} in mode: ${this.mode}`);
        }
    },
};

// Class definition ==============================================================================================================
// ===============================================================================================================================

class Element {
    elementName='';
    elementId='';
    elementStatus='normal';
    position=[];
    rotateCount=0;
    flipCount=0;
    relative={
        shape:null,
        shapeN:null,
        terminal:[],
    };
    shape=[];
    posMap={};

    constructor(elementName, elementId) {
        this.elementName = elementName;
        this.elementId = elementId;
    }

    shift(XY) {
        this.position = sub_XY2pos(XY);
        this.renderShape();
    }

    rotate(centerOfRotation=null) { 
        if (this.elementName === 'node') return;

        this.rotateCount = (this.rotateCount + 1) % 4;

        // rotate shape
        let [X,Y] = this.relative.shape;
        // a=0; b=1; c=-1; d=0;
        let Xr = X.map((x, i) => x === null || Y[i] === null ? null : -Y[i]);
        let Yr = Y.map((y, i) => X[i] === null || y === null ? null : X[i]);
        this.relative.shape = [Xr,Yr];

        // rotate terminal
        let terminal = this.relative.terminal;
        terminal = terminal.map(num => (num+1) % 4);
        this.relative.terminal = terminal;

        // rotate position around center of rotation (optional)
        if (centerOfRotation) {
            let [Xpos, Ypos] = sub_pos2XY(this.position);
            let [Xcenter,Ycenter] = centerOfRotation;
            let Xnew = Xcenter-(Ypos-Ycenter);
            let Ynew = Ycenter+(Xpos-Xcenter);            
            this.position = sub_XY2pos([Xnew,Ynew])
        };
        this.renderShape();
    }

    flip(centerOfRotation=null) {
        if (this.elementName === 'node') return;

        this.flipCount = (this.flipCount + 1) % 2;
        
        // flip shape
        let [X,Y] = this.relative.shape;
        X = X.map(num => -num)
        this.relative.shape = [X,Y];

        // flip terminal
        let terminal = this.relative.terminal;
        terminal = terminal.map(num => {num===0?  2 : (num===2? 0 : num)});
        this.relative.terminal = terminal;

        // flip position around center of rotation (optional)
        if (centerOfRotation) {
            let [Xpos, Ypos] = sub_pos2XY(this.position);
            let [Xcenter,Ycenter] = centerOfRotation;
            let Xnew = Xcenter-(Xpos-Xcenter);          
            this.position = sub_XY2pos([Xnew,Ypos])
        };

        this.renderShape();
    }

    renderShape() {
        // shape shift
        let shape = this.relative.shape;  
        let shapeN = this.relative.shapeN;  
        let offset = sub_pos2XY(this.position);
        this.shape = sub_shiftShapeMerged(shape, shapeN, offset); 

        // position mapping
        function sub_positionShift(position,terminalIndex) {
            let [X,Y] = sub_pos2XY(position);
            if (terminalIndex === 0) X=X+2;
            else if (terminalIndex === 1) Y=Y+2;
            else if (terminalIndex === 2) X=X-2;
            else if(terminalIndex === 3) Y=Y-2;
            return sub_XY2pos([X,Y]);
        };
        let position = this.position;
        let posMap = {};
        posMap[position] = {elementId:this.elementId, elementType:'element',positionType:''}

        // terminal position mapping
        for (let terminalIndex of this.relative.terminal) {
            let terminalPosition = sub_positionShift(position,terminalIndex);
            posMap[terminalPosition] = {elementId:this.elementId, elementType:'terminal',positionType:''}
        }
        this.posMap = posMap;

        //
    }
};


class Node {
    elementName='';
    elementId='';
    elementStatus='normal';
    segments=[];    
    shape=[];
    terminals=[];
    posMap={};
    isObsolete=false;
    
    constructor(elementName, elementId) {
        this.elementName = elementName;
        this.elementId = elementId;
    };

    shiftStart(startingXY) {
        let posid = sub_XY2pos(startingXY);
        let posMap = {};
        posMap[posid] = {elementId:this.elementId,elementType:'node',positionType:[false,false,false,false]}; 
        this.posMap = posMap;
    };

    shift(startingXY,endingXY,continuousXY) {

        let deltaX = Math.abs(startingXY[0] - continuousXY[0]);
        let deltaY = Math.abs(startingXY[1] - continuousXY[1]);
        let posIds;
    
        if (deltaX > deltaY) { // x-dir. node guide line
            endingXY[1] = startingXY[1]; 
            let minX = Math.min(endingXY[0], startingXY[0]);
            let maxX = Math.max(endingXY[0], startingXY[0]);
            posIds = Array.from({ length: maxX - minX + 1 }, (_, i) => sub_XY2pos([minX+i,endingXY[1]]));
    
        } else { // y-dir. node guide line
            endingXY[0] = startingXY[0]; 
            let minY = Math.min(endingXY[1], startingXY[1]);
            let maxY = Math.max(endingXY[1], startingXY[1]);
            posIds = Array.from({ length: maxY - minY + 1 }, (_, i) => sub_XY2pos([endingXY[0],minY+i]));
        }

        this.segments = [[startingXY,endingXY]];
        this.renderShape();
    };

    renderShape(){ // identify shape and posmap w/ position classification

        function sub_addPoint(nodeId, key, newDirection, terminalPositionId, posMap) {
            if (key in posMap) {
                let prevDirection = posMap[key];
                newDirection = prevDirection.map((val, index) => val || newDirection[index]);
            }
            let elementType;
            if (terminalPositionId.includes(key)) elementType = 'terminal';
            else elementType = 'node';
            posMap[key] = {elementId:nodeId,elementType:elementType,positionType:newDirection};    
            return posMap;
        }

        let segments = this.segments;
        let terminals = this.terminals;
        let nodeId = this.elementId;
    
        let posMap = {};
        let shape = [];        
        
        for (let segment of segments) {
            let [x1, y1] = segment[0]; // 1st point
            let [x2, y2] = segment[1]; // 2nd point

            shape = sub_concatXYs(shape,[[x1,x2],[y1,y2]]);
    
            let isHorizontal = Math.abs(y1-y2) < 0.5;
            let direction;
            
            if (isHorizontal) { // horizontal segment
                const start = Math.min(x1, x2);
                const end = Math.max(x1, x2);
                for (let x = start; x <= end; x+=2) {
                    if (Math.abs(start-end)<0.5) direction = [false,false,false,false];
                    else if (Math.abs(x-start)<0.5) direction = [true,false,false,false];
                    else if (Math.abs(x-end)<0.5) direction = [false,false,true,false];
                    else direction = [true,false,true,false];
                    let key = sub_XY2pos([x,y1]);
                    posMap = sub_addPoint(nodeId, key, direction, terminals, posMap);
                }
            } else { // vertical segment
                const start = Math.min(y1, y2);
                const end = Math.max(y1, y2);
                for (let y = start; y <= end; y+=2) {
                    if (Math.abs(start-end)<0.5) direction = [false,false,false,false];
                    else if (Math.abs(y-start)<0.5) direction = [false,true,false,false];
                    else if (Math.abs(y-end)<0.5) direction = [false,false,false,true];
                    else direction = [false,true,false,true];
                    let key = sub_XY2pos([x1,y]);
                    posMap = sub_addPoint(nodeId, key, direction, terminals, posMap);
                }
            }
        }
    
        this.shape = shape;
        this.posMap = posMap;

    };


};

// Initialization ================================================================================================================
// ===============================================================================================================================

// List of event types to observe
const observedEvents = ["mousemove", "mousedown", "mouseup", "keydown", "keyup", "wheel"];
// Add event listeners to the document
observedEvents.forEach((eventType) => {
    document.addEventListener(eventType, (event) => prjManager.handleEvent(event));
});
window.addEventListener("resize", (event) => prjManager.handleEvent(event)); // resize

// load circuit data
// prjManager.circuitData = circuitData

// function fetchCircuitData() {
//     fetch('https://raw.githubusercontent.com/sys8994/circuitsim/master/data.json')
//     .then(response => response.json())
//     .then(data => {
//         prjManager.circuitData = data
//         console.log('circuitData:',prjManager.circuitData)
//     })
//     .catch(error => console.error('Error loading JSON:', error));
// }
// fetchCircuitData()
// console.log('circuitData:',circuitData)


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
const lims0 = prjManager.canvasProperty.canvasRangeLimit[0];
const lims1 = prjManager.canvasProperty.canvasRangeLimit[1];
const x_grid = [];
const y_grid = [];
for (let a = lims0; a <= lims1; a += 2) {
    x_grid.push(a, a, NaN, lims0, lims1, NaN);
    y_grid.push(lims0, lims1, NaN, a, a, NaN);
}

const lineObjGroups = {
    grid: { x:x_grid, y:y_grid, line: { color: 'rgb(230,230,230)', width: 0.5 }, },
    gridBoundary: { x: [lims0, lims1, lims1, lims0, lims0], y: [lims0, lims0, lims1, lims1, lims0], line: { color: 'rgb(130,130,130)', width: 1.0 }, },
    lineSelect: { line: { color: 'rgb(28, 0, 213)', width: 3.0 }, },
    lineNormal: { line: { color: 'rgb(40,40,40)', width: 1.5 }, },
    lineError: { line: { color: 'rgb(228, 7, 51)', width: 2.0 }, },
    lineNoPara: { line: { color: 'rgb(238, 227, 28)', width: 1.5 }, },
    lineHover: { line: { color: 'rgb(90, 152, 146)', width: 1.5 }, },
    markerSelect: { line: {width: 0}, mode:'marker', marker: { color: 'rgb(28, 0, 213)', size: 12.0 }, },
    markerNormal: { line: {width: 0}, mode:'marker', marker: { color: 'rgb(40,40,40)', size: 6.0 }, },
    markerError: { line: {width: 0}, mode:'marker', marker: { color: 'rgb(228, 7, 51)', size: 8.0 }, },
    markerNoPara: { line: {width: 0}, mode:'marker', marker: { color: 'rgb(238, 227, 28)', size: 6.0 }, },
    markerHover: { line: {width: 0}, mode:'marker', marker: { color: 'rgb(90, 152, 146)', size: 6.0 }, },
    lineRelevant: { line: { color: 'rgb(125, 107, 240)', width: 1.5 }, },
    lineCreateNormal: { line: { color: 'rgb(190,190,190)', width: 1.2, }, },
    drag: {type: "scatter", line: { color: "rgba(112, 112, 112, 0.5)", width: 0.5 }, fill: "toself", fillcolor: "rgba(216, 216, 216, 0.5)", },
}

lineIndex = 0;
for (const name in lineObjGroups) {
    let lineObj = {
        x: [], 
        y: [], 
        mode: 'lines',
        hoverinfo: 'none',
        name: name,
    };
    let lineInfo = lineObjGroups[name];
    for (const info in lineInfo) {
        lineObj[info] = lineInfo[info];
    }
    prjManager.plotObject.lineData.push(lineObj);
    prjManager.plotObject.lineDataMap[name]=lineIndex;
    lineIndex += 1;
}


// plotly initialization
function initiatePlotly(layout, config, prjManager) {
    const { canvas, Plotly } = prjManager.plotObject; // Access Plotly and canvas via prjManager.plotObject
    Plotly.newPlot(canvas, prjManager.plotObject.lineData, layout, config);
    Plotly.relayout('canvas', {
        'xaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
        'yaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
    });
}
initiatePlotly(layout, config, prjManager)

canvasResize([],prjManager)
