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
    },
    tempData: {
        elements: {}, // circuit elements 
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
        selectedIdList:[],
    },    
    clipboard:{
        copiedElements:{},
        centerPosition:[null,null],
    },
    stack:{
        maxStack: 30,
        undo:[],
        redo:[],
    },
    canvasProperty: {
        pixelsPerUnit: 30, // default pixels per unit (grid)
        minPixelsPerUnit: 1,
        maxPixelsPerUnit: 100,
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
                prjManager.uiStatus.currentXY = [event.clientX, event.clientY];
                if (prjManager.uiStatus.dragClicked) { 
                    canvasDrag(event, prjManager, opt='drag');
                } else {
                    canvasDrag(event, prjManager, opt='hover');
                }
            },
            mouseup: (event) => {
                if (prjManager.uiStatus.dragClicked) { canvasDrag(event, prjManager, opt='up') }
            },                
            keydown: (event) => {
                if (event.ctrlKey && !prjManager.uiStatus.isCtrl) { 
                    setCtrlStatus(event, prjManager,'press');
                }
                else if (prjManager.uiStatus.isCtrl) {
                    if (event.key === 'c' || event.key === 'x') { copyElement(event,prjManager) } 
                    else if (event.key === 'v') { pasteElement(event,prjManager) } 
                    else if (event.key === 's') { saveProject(event,prjManager) } 
                    else if (event.key === 'z') { undoData(event,prjManager) } 
                    else if (event.key === 'x') { cutData(event,prjManager) } 
                    else if (event.key === 'y') { redoData(event,prjManager) } 
                }
                else if (event.key === 'Delete') { deleteElement(event,prjManager) }
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
                }
                else if (prjManager.uiStatus.isCtrl) {
                    if (event.key === 's') { saveProject(event,prjManager) } 
                    else if (event.key === 'z') { undoData(event,prjManager) } 
                    else if (event.key === 'x') { cutData(event,prjManager) } 
                    else if (event.key === 'y') { redoData(event,prjManager) } 
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
            selectedIdList:[],
        };
    },

    resetTempData() {        
        this.tempData= {
            elements: {}, // circuit elements 
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

const ElementTemplate = {
    elementName:'',
    elementId:'',
    elementStatus:'normal',
    rotateCount:0,
    flipCount:0,
    slaveIds:[],

    centerPosition:[], // pos
    offsetPosition:[], // pos
    renderedLineXY:[], // XY
    renderedMarkerXY:[], // XY

    relative:{
        shape:null,
        shapeN:null,
    },

    posMap:{}
};

const NodeTemplate = {
    elementName:'',
    elementId:'',
    elementStatus:'normal', 
    terminalIds:[],

    centerPosition:[], // pos
    offsetSegments:[], // segments
    renderedLineXY:[], // XY
    renderedMarkerXY:[], // XY

    segments:[],   

    posMap:{},
};

const TerminalTemplate = {
    elementName:'terminal',
    elementId:'',
    elementStatus:'normal',
    masterId:[],

    centerPosition:[], // pos
    offsetPosition:[], // pos
    renderedLineXY:[], // XY
    renderedMarkerXY:[], // XY

    posMap:{},
};

class Element {

    static shift(element,XY) {
        element.centerPosition = sub_XY2pos(XY);        
        this.renderShape(element);
    }

    static rotate(element) { 
        element.rotateCount = (element.rotateCount + 1) % 4;

        // rotate shape
        let [X,Y] = element.relative.shape;
        // a=0; b=1; c=-1; d=0;
        let Xr = X.map((x, i) => x === null || Y[i] === null ? null : -Y[i]);
        let Yr = Y.map((y, i) => X[i] === null || y === null ? null : X[i]);
        element.relative.shape = [Xr,Yr];

        // rotate offset
        let [offsetX,offsetY] = sub_pos2XY(element.offsetPosition);
        element.offsetPosition = sub_XY2pos([-offsetY, offsetX]);

        this.renderShape(element);
    }

    static flip(element) {
        element.flipCount = (element.flipCount + 1) % 2;
        
        // flip shape
        let [X,Y] = element.relative.shape;
        X = X.map(num => -num)
        element.relative.shape = [X,Y];
        
        // flip offset
        let [offsetX,offsetY] = sub_pos2XY(element.offsetPosition);
        element.offsetPosition = sub_XY2pos([-offsetX, offsetY]);

        this.renderShape(element);
    }

    static renderShape(element) {
        
        let shape = element.relative.shape;  
        let shapeN = element.relative.shapeN; 
        let centerPosition = sub_pos2XY(element.centerPosition);
        let offset = sub_pos2XY(element.offsetPosition); 
        let realPosition = [centerPosition[0]+offset[0] , centerPosition[1]+offset[1]];
        element.renderedLineXY = sub_shiftShapeMerged(shape, shapeN, realPosition); 

        let posMap = {};
        posMap[realPosition] = {elementId:element.elementId, elementType:'element',positionType:''}
        element.posMap = posMap;
    }
};

class Terminal {

    static shift(element,XY) {        
        element.centerPosition = sub_XY2pos(XY);        
        this.renderShape(element);
    }
    
    static rotate(element) { 
        // rotate offset
        let [offsetX,offsetY] = sub_pos2XY(element.offsetPosition);
        element.offsetPosition = sub_XY2pos([-offsetY, offsetX]);
        this.renderShape(element);
    }

    static flip(element) {
        // flip offset
        let [offsetX,offsetY] = sub_pos2XY(element.offsetPosition);
        element.offsetPosition = sub_XY2pos([-offsetX, offsetY]);
        this.renderShape(element);
    }

    static renderShape(element) {

        let centerPosition = sub_pos2XY(element.centerPosition);
        let offset = sub_pos2XY(element.offsetPosition);   
        let realPosition = [centerPosition[0]+offset[0] , centerPosition[1]+offset[1]];     
        element.renderedMarkerXY = [[centerPosition[0]+offset[0]], [centerPosition[1]+offset[1]]];

        let posMap = {};
        posMap[realPosition] = {elementId:element.elementId, elementType:'terminal',positionType:[false,false,false,false]}
        element.posMap = posMap;
    }
}

class Node {

    static shiftStart(element,startingXY) {
        let posid = sub_XY2pos(startingXY);
        let posMap = {};
        posMap[posid] = {elementId:element.elementId,elementType:'node',positionType:[false,false,false,false]}; 
        element.posMap = posMap;
    };

    static shiftEnd(element,startingXY,endingXY,continuousXY) {

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

        element.segments = [[startingXY,endingXY]];
        this.renderShape(element);
    };

    static shift(element,XY) {
        element.centerPosition = sub_XY2pos(XY);
        this.renderSegment(element);
    };

    static rotate(element) {
        // rotate offset segment
        element.offsetSegments = element.offsetSegments.map(segment => [[-segment[0][1],segment[0][0]], [-segment[1][1],segment[1][0]]]);
        
        this.renderSegment(element);
    };

    static flip(element) {
        // flip offset segment
        element.offsetSegments = element.offsetSegments.map(segment => [[-segment[0][0],segment[0][1]], [-segment[1][0],segment[1][1]]]);
        
        this.renderSegment(element);
    };

    static renderSegment(element) {        
        let XY = sub_pos2XY(element.centerPosition);
        element.segments = element.offsetSegments.map(val => [[val[0][0]+XY[0],val[0][1]+XY[1]], [val[1][0]+XY[0],val[1][1]+XY[1]]]);        
        this.renderShape(element);
    }

    static renderShape(element){ // identify shape and posmap w/ position classification

        function sub_addPoint(nodeId, key, newDirection, terminalPositionId, posMap) {
            if (key in posMap) {
                let oldDirection = posMap[key].positionType;
                newDirection = oldDirection.map((val, index) => val || newDirection[index]);
            }
            let elementType;
            if (terminalPositionId.includes(key)) elementType = 'terminal';
            else elementType = 'node';
            posMap[key] = {elementId:nodeId,elementType:elementType,positionType:newDirection};    
            return posMap;
        }

        let segments = element.segments;
        let terminalIds = element.terminalIds;
        let nodeId = element.elementId;
    
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
                for (let x = start; x <= end; x+=1) {
                    if (Math.abs(start-end)<0.5) direction = [false,false,false,false];
                    else if (Math.abs(x-start)<0.5) direction = [true,false,false,false];
                    else if (Math.abs(x-end)<0.5) direction = [false,false,true,false];
                    else direction = [true,false,true,false];
                    let key = sub_XY2pos([x,y1]);
                    posMap = sub_addPoint(nodeId, key, direction, terminalIds, posMap);
                }
            } else { // vertical segment
                const start = Math.min(y1, y2);
                const end = Math.max(y1, y2);
                for (let y = start; y <= end; y+=1) {
                    if (Math.abs(start-end)<0.5) direction = [false,false,false,false];
                    else if (Math.abs(y-start)<0.5) direction = [false,true,false,false];
                    else if (Math.abs(y-end)<0.5) direction = [false,false,false,true];
                    else direction = [false,true,false,true];
                    let key = sub_XY2pos([x1,y]);
                    posMap = sub_addPoint(nodeId, key, direction, terminalIds, posMap);
                }
            }
        }

        let joint = []; 
        for (let pos in posMap) {
            let direction = posMap[pos].positionType;
            let count = direction.filter(value => value).length;
            if (count>=3) joint.push(pos);            
        }
        joint = sub_pos2XY(joint);
    
        element.renderedLineXY = shape;
        element.renderedMarkerXY = joint;
        element.posMap = posMap;
        

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


// plot objects initialization ===================================================================================================
// ===============================================================================================================================

// layout
const layout = {
    title: '',
    showlegend: false,
    dragmode: false,
    hovermode: false,

    xaxis: {
        scaleanchor: 'y',
        scaleratio: 1,
        showgrid: false,
        dtick: 1,
        zeroline: false,
        showticklabels: false,
        range: [-10, 10],
        title: ''
    },
    yaxis: {
        showgrid: false,
        dtick: 1,
        zeroline: false,
        showticklabels: false,
        range: [-10, 10],
        title: ''
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
};
const config = {
    displayModeBar: false,
    doubleClick: false,
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
    grid: { x:x_grid, y:y_grid, line: { color: 'rgb(230,230,230)', width: 0.5 }, visible:true, },
    gridBoundary: { x: [lims0, lims1, lims1, lims0, lims0], y: [lims0, lims0, lims1, lims1, lims0], line: { color: 'rgb(130,130,130)', width: 1.0 }, visible:true, },
    lineSelect: { line: { color: 'rgb(28, 0, 213)', width: 3.0 }, visible:true, },
    lineNormal: { line: { color: 'rgb(40,40,40)', width: 1.5 }, visible:true, },
    lineError: { line: { color: 'rgb(228, 7, 51)', width: 2.0 }, visible:true, },
    lineNoPara: { line: { color: 'rgb(238, 227, 28)', width: 1.5 }, visible:true, },
    lineHover: { line: { color: 'rgb(90, 152, 146)', width: 1.5 }, visible:true, },
    markerSelect: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(28, 0, 213)', size: 8.0 }, visible:true, },
    markerNormal: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(40,40,40)', size: 6.0 }, visible:true, },
    markerError: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(228, 7, 51)', size: 7.0 }, visible:true, },
    markerNoPara: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(238, 227, 28)', size: 6.0 }, visible:true, },
    markerHover: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(90, 152, 146)', size: 6.0 }, visible:true, },
    lineRelevant: { line: { color: 'rgb(125, 107, 240)', width: 1.5 }, visible:true, },
    markerRelevant: { line: {width: 0}, mode:'lines+markers', marker: { color: 'rgb(125, 107, 240)', size: 6.0 }, visible:true, },
    lineCreateNormal: { line: { color: 'rgb(190,190,190)', width: 1.2, }, visible:true, },
    drag: {type: "scatter", line: { color: "rgba(112, 112, 112, 0.5)", width: 0.5 }, fill: "toself", fillcolor: "rgba(216, 216, 216, 0.5)", visible:true, },
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

function initiatePlotly(layout, config, prjManager) { // plotly initialization
    const { canvas, Plotly } = prjManager.plotObject; // Access Plotly and canvas via prjManager.plotObject
    Plotly.newPlot(canvas, prjManager.plotObject.lineData, layout, config);
    Plotly.relayout('canvas', {
        'xaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
        'yaxis.range': [(lims0+lims1)/2-20,(lims0+lims1)/2+20,],
    });
}

initiatePlotly(layout, config, prjManager)
canvasResize([],prjManager)
