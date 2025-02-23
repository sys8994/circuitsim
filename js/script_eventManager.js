
// External event functions ======================================================================================================
// ===============================================================================================================================



function setCtrlStatus(event, prjManager,option) {
    if (option === 'press') {
        prjManager.uiStatus.isCtrl = true;
    } else {
        prjManager.uiStatus.isCtrl = false;
    }
    console.log('ctrl pressed!!!!!!', prjManager.uiStatus.isCtrl)


    if (prjManager.mode === 'create') hoverElement(event,prjManager,isRendering=true);
}




// XXX : do with drag
function canvasDrag(event,prjManager,opt) {
    if (opt=='down') {

        let [X1,Y1] = sub_roundXY(event,prjManager,deg=0)
        if (!X1) return;
    
        prjManager.uiStatus.dragClicked = true; // Activate drag mode
        prjManager.uiStatus.clickedPoint1 = [X1,Y1]; // Set start point
        prjManager.uiStatus.clickedPoint2 = [X1,Y1]; // Set start point
    

    } else if (opt=='move') {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = sub_roundXY(event,prjManager,deg=0,bound=false) // unbounded mouse drag
        prjManager.uiStatus.clickedPoint2 = [X2,Y2]
        
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);

        // drag object range change
        sub_modifyLine(prjManager,'drag', { x: [[Xmin,Xmax,Xmax,Xmin,Xmin]], y: [[Ymin,Ymin,Ymax,Ymax,Ymin]] });
        
    } else {
        let [X1,Y1] = prjManager.uiStatus.clickedPoint1 
        let [X2,Y2] = prjManager.uiStatus.clickedPoint2
        prjManager.uiStatus.dragClicked = false; // Deactivate drag mode
        prjManager.uiStatus.clickedPoint1 = [];
        prjManager.uiStatus.clickedPoint2 = [];
    
        if (!X1 | !X2 | !Y1 | !Y2) return;    
        Xmin = Math.min(X1,X2);
        Xmax = Math.max(X1,X2);
        Ymin = Math.min(Y1,Y2);
        Ymax = Math.max(Y1,Y2);
    
        // Perform action on drag
        sub_modifyLine(prjManager, 'drag', { x: [[]], y: [[]] });
        
        // drag
        //
        //               
    }
}



hotkeyObj = {
    '1':'nodeline',
    '2':'source',
    '3':'ground',
    '4':'resistor',
    '5':'capacitor',
    '6':'nmos',
    '7':'pmos',
    '8':'ots',
    '9':'mtj',
    '0':'nonlin',
    't':'text',
}
function selectElement(event,prjManager) {

    let elementName
    if (event.type=='keydown') {
        if (!elementName in hotkeyObj) return;
        elementName = hotkeyObj[event.key]
    } else if (event.type ==='mousedown') {
        elementName = event.target.id.replace('btn-','');
    }

    // uiData update by clicked circuit element    
    prjManager.createElement.name = elementName;
    if (elementName == 'nodeline') { // nodeline
        prjManager.createElement.shape = prjManager.circuitData.shapeset.shape_nodepnt;
        prjManager.createElement.node = {
            isClicked: false,
            startingXY: [],
            endingXY: [],
        }
    } else { // normal element
        const elementDefault = prjManager.circuitData.element[elementName]
        prjManager.createElement.shape = elementDefault.shape
        prjManager.createElement.shapeN = elementDefault.shapeN
        prjManager.createElement.polarity = elementDefault.polarity
        prjManager.createElement.rotation = elementDefault.rotation
        prjManager.createElement.terminal = elementDefault.terminal
    }
    
    // html control : remove / set "btn-clicked" class 
    document.querySelectorAll('.div-element.btn-clicked').forEach((el) => { el.classList.remove('btn-clicked'); });    
    document.getElementById('btn-'+elementName).classList.add('btn-clicked');

    // set mode to "create mode"
    prjManager.setMode('create')

    // hover rendering
    hoverElement(event,prjManager,isRendering=true)
}

// XXX
function selectOption(event,prjManager) {

}

// XXX
function deleteElement(event,prjManager) {

}

// XXX
function copyElement(event,prjManager) {

}

// XXX
function pasteElement(event,prjManager) {

}

// XXX highlight
function hoverElement(event, prjManager,isRendering=false) {

    //////// 이거 전면수정하자. copy paste도 커버할 수 있도록.
    // 일단 select Element 또는 select Paste mode가 되면, elementGroups, nodeGroups를 createElement에다 임시객체로 옮기고
    // hoverElement에서는 이 임시객체를 다루는 일만 하자.
    // xy offset 주고, validity check 하고, related node highlight (신설) 하고.
    // rotate, switch도 얘네들을 다 커버할 수 있도록 수정하자.
    // 그리고 createElement를 누르면, 임시 객체를 그냥 실제 객체로 옮겨서 등록하는 일만 하면 되겠지. 물론 nodegroup은 다시 계산해야겠지만.
    // 근데 그 조차도 이미 node hover 시 related node highlight에 다 있음.

    // activate when XY grid changes 
    const hoverPoint = prjManager.uiStatus.hoverPoint
    const hoverPointContinuous = prjManager.uiStatus.hoverPointContinuous
    if (isRendering) { // element select by hotkey
        XY = hoverPoint
        XYContinuous = hoverPointContinuous
    } else {
        XY = sub_roundXY(event,prjManager,deg=2)
        if (hoverPoint.length != 0 && hoverPoint[0] == XY[0] && hoverPoint[1] == XY[1]) return;
        XYContinuous = sub_roundXY(event,prjManager,deg=0)
    }
    prjManager.uiStatus.hoverPoint = XY

    let hoverShape = [];
    let typeMap = {};
    if (prjManager.createElement.name === 'nodeline') { // nodeline

        const shapeCircle = prjManager.createElement.shape;
        if (!prjManager.createElement.node.isClicked) { // starting point
            let hoverCircle = sub_shiftShape(shapeCircle, XY);
            hoverShape = hoverCircle;
            typeMap[sub_XY2pos(XY)] = {elementType:'node', positionType:'edge'}

        } else { // ending point
            const startingXY = prjManager.createElement.node.startingXY;

            let [endingXY, posIds] = sub_generateNodeLine(startingXY, XY, XYContinuous, prjManager);
            const shapeLineSegment = [[startingXY[0],endingXY[0]],[startingXY[1],endingXY[1]]];  
            let hoverCircle = sub_shiftShape(shapeCircle, endingXY);
            hoverShape = sub_concatXYs(hoverCircle,shapeLineSegment); // single line segment
            prjManager.createElement.node.shape = shapeLineSegment;
            prjManager.createElement.node.posIds = posIds;

            // typeMap obj
            posIds.forEach(key => typeMap[key] = {elementType:'node', positionType:'body'});
            typeMap[sub_XY2pos(startingXY)] = {elementType:'node', positionType:'edge'};
            typeMap[sub_XY2pos(endingXY)] = {elementType:'node', positionType:'edge'};
        }
    } else { // normal element
        const shape = prjManager.createElement.shape;
        const shapeN = prjManager.createElement.shapeN;
        hoverShape = sub_shiftShapeMerged(shape, shapeN, XY);

        // typeMap obj
        const terminal = prjManager.createElement.terminal;
        const terminalShifted = sub_shiftShape(terminal,XY);
        const posIdsTerminal = sub_XY2pos(terminalShifted);
        typeMap[sub_XY2pos(XY)] =  {elementType:'element', positionType:''};
        posIdsTerminal.forEach(key => typeMap[key] = {elementType:'node', positionType:'terminal'});
    }   
    prjManager.createElement.hoverShape = hoverShape;
    prjManager.createElement.typeMap = typeMap;



    // validity check
    let isValid = sub_validityCheck(prjManager)
    prjManager.createElement.isValid = isValid; 
    lineColor = isValid ? 'rgb(190,190,190)' : 'rgb(255, 112, 112)';

    // element rendering
    sub_modifyLine(prjManager, 'elementCreateNormal', { x: [hoverShape[0]], y: [hoverShape[1]], 'line.color': lineColor});

    // relevant element rendering (highlight for nodelines)
    // ctrl or not
    // 1. starting : node인 경우 해당 node를 highlight
    // 2. ending : node인 경우 해당 node를 highlight
    // 3. ctrl : starting - ending 사이에 node인 경우 해당 node들을 highlight
    //
    //

    
}

// XXX : nodeline 완성 필요
function createElement(event,prjManager) {

    // validity check
    if (!prjManager.createElement.isValid) return

    // nodeline
    const isNodeline = prjManager.createElement.name === 'nodeline'
    if (isNodeline) {
        if (!prjManager.createElement.node.isClicked) {
            prjManager.createElement.node.startingXY = prjManager.uiStatus.hoverPoint;
            prjManager.createElement.node.isClicked = true;
            hoverElement(event,prjManager,isRendering=true) 
            return; 
        } else {
            prjManager.createElement.node.isClicked = false;
            if (event.CtrlKey) prjManager.uiStatus.isCtrl = event.CtrlKey;
        }
    }

    // register new element & map
    if (isNodeline) sub_createNodeObject(prjManager);
    else sub_createElementObject(prjManager);

    // graph obj rendering ==> 나중에 이건 따로 함수로 뺴자-----------------------------------
    let elementNormal = [[],[]];
    let elementNoPara = [[],[]];
    let elementError = [[],[]];
    let terminalNormal = [[],[]];
    let terminalError = [[],[]];
    // let polarityelementNormal = [[],[]];
    // let polarityelementNoPara = [[],[]];
    // let polarityelementError = [[],[]];


    let elementsObj = prjManager.data.elements;
    for (const elementId in elementsObj) {
        let element = elementsObj[elementId];
        if (element.name == 'terminal' || element.name == 'nodeline') continue; 
         // main element shape line, polarity line
        if (element.elementStatus == 'normal') {
            elementNormal = sub_concatXYs(elementNormal,element.shapeMerged);
        } else if (element.elementStatus == 'error') {
            elementError = sub_concatXYs(elementError,element.shapeMerged);
        } else if (element.elementStatus == 'nopara') {
            elementNoPara = sub_concatXYs(elementNoPara,element.shapeMerged);
        }
    }

    let nodeGroups = prjManager.data.nodeGroups;
    for (const nodeId in nodeGroups) {
        let nodeGroup = nodeGroups[nodeId];
        let terminalScat = sub_pos2XY(nodeGroup.terminalPositionId);
        let jointScat = sub_pos2XY(nodeGroup.jointPositionId);
        terminalNormal = sub_concatXYs(terminalNormal,sub_concatXYs(terminalScat,jointScat));
        elementNormal = sub_concatXYs(elementNormal,nodeGroup.shapeMerged);        
    }
    

    
    sub_modifyLine(prjManager,'elementNormal',elementNormal)
    sub_modifyLine(prjManager,'elementNoPara',elementNoPara)
    sub_modifyLine(prjManager,'elementError',elementError)
    sub_modifyLine(prjManager,'terminalNormal',terminalNormal)
    sub_modifyLine(prjManager,'terminalError',terminalError)

    // ---------------------------------------------------------------------------------------------------------

    // hover rendering
    hoverElement(event,prjManager,isRendering=true) 

    // delca calc for undo/redo


    console.log(prjManager.data)
    

}

function rotateElement(event,prjManager) {
    let elementName = prjManager.createElement.name;
    if (elementName === 'text' || elementName === 'nodeline') return;
    // 90deg rotation in clock-wise
    prjManager.createElement.rotation = (prjManager.createElement.rotation + 1) % 4;
    prjManager.createElement.shape = sub_rotateVectors(prjManager.createElement.shape);
    prjManager.createElement.terminal = sub_rotateVectors(prjManager.createElement.terminal);
    // hover rendering
    hoverElement(event,prjManager,isRendering=true)
}

function switchElement(event,prjManager) {
    let elementName = prjManager.createElement.name;
    if (elementName === 'text' || elementName === 'nodeline') return;
    // flip under y-axis (x -> -x)
    prjManager.createElement.polarity = (prjManager.createElement.polarity + 1) % 2;
    prjManager.createElement.shape = sub_flipVectors(prjManager.createElement.shape);   
    prjManager.createElement.terminal = sub_flipVectors(prjManager.createElement.terminal);
    // hover rendering
    hoverElement(event,prjManager,isRendering=true)
}

// XXX
function saveProject(event,prjManager) {

}

// XXX
function resetMode(event,prjManager) {
    prjManager.mode = 'normal';
    prjManager.createElement = {
        name: null,
        polarity: 0,
        rotation: 0,
        shape: null,
        shapeN: null,
        hoverShape: [],
        terminal: null,
        isValid: true,
        typeMap: null,
        node: null,
    },
    sub_modifyLine(prjManager,'elementCreateNormal',[]);
}

function canvasResize(_, prjManager) {

    const width_left = 80;
    const width_right = 200;
    const actualWidth = window.innerWidth / window.devicePixelRatio;
    const actualHeight = window.innerHeight;
    const count_right = 4 - document.querySelectorAll('.hidden').length;
    const height_top_offset = document.querySelector('.container-title').offsetHeight;

    prjManager.plotObject.canvas.style.width = `${actualWidth - width_left - width_right * count_right}px`;
    prjManager.plotObject.canvas.style.height = `${actualHeight - height_top_offset - 50}px`;

    prjManager.plotObject.Plotly.relayout('canvas', {
        width: prjManager.plotObject.canvas.offsetWidth - 2,
        height: prjManager.plotObject.canvas.offsetHeight - 2,
    });

    sub_rerangeCanvas(prjManager);
    return
}

function canvasWheel(event, prjManager) {
    const canvas = prjManager.plotObject.canvas;
    if (!canvas.contains(event.target)) return;


    // 플롯 크기 및 현재 범위 가져오기
    const plot = canvas._fullLayout;
    const width = plot.width;
    const height = plot.height;

    const currentXRange = plot.xaxis.range; // [xmin, xmax]
    const currentYRange = plot.yaxis.range; // [ymin, ymax]

    const xRangeSize = currentXRange[1] - currentXRange[0];
    const yRangeSize = currentYRange[1] - currentYRange[0];


    
    let rect = canvas.getBoundingClientRect();
    let startX = event.clientX - rect.left;
    let startY = event.clientY - rect.top;

    // 마우스 위치를 그래프 좌표로 변환
    const mouseX = (startX / width) * xRangeSize + currentXRange[0];
    const mouseY = (1 - startY / height) * yRangeSize + currentYRange[0];

    // 줌 인/아웃 스케일 조정
    const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1; // 줌인(스크롤 위): 0.9, 줌아웃(스크롤 아래): 1.1
    const newPixelsPerUnit = prjManager.canvasSizeVar.pixelsPerUnit / zoomFactor;
    if (newPixelsPerUnit < prjManager.canvasSizeVar.minPixelsPerUnit) {
        prjManager.canvasSizeVar.pixelsPerUnit = prjManager.canvasSizeVar.minPixelsPerUnit
    } else if (newPixelsPerUnit > prjManager.canvasSizeVar.maxPixelsPerUnit) {
        prjManager.canvasSizeVar.pixelsPerUnit = prjManager.canvasSizeVar.maxPixelsPerUnit
    } else {
        prjManager.canvasSizeVar.pixelsPerUnit = newPixelsPerUnit;
    }

    // 새로운 범위 계산
    const newXRange = [
        Math.max(mouseX - (mouseX - currentXRange[0]) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(mouseX + (currentXRange[1] - mouseX) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(mouseY - (mouseY - currentYRange[0]) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(mouseY + (currentYRange[1] - mouseY) * zoomFactor, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];
    // 범위 업데이트
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}

function canvasMove(event,prjManager) {

    if (!prjManager.plotObject.canvas.layout) return;

    const currentXRange = prjManager.plotObject.canvas.layout.xaxis.range;
    const currentYRange = prjManager.plotObject.canvas.layout.yaxis.range;

    let newXRange = [...currentXRange];
    let newYRange = [...currentYRange];

    let keystep = prjManager.canvasSizeVar.arrowKeyStep /  prjManager.canvasSizeVar.pixelsPerUnit;

    switch (event.key) {
        case 'ArrowLeft': // 왼쪽 방향키
            newXRange = [
                Math.max(currentXRange[0] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
                Math.max(currentXRange[1] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
            ];
            break;
        case 'ArrowRight': // 오른쪽 방향키
            newXRange = [
                Math.min(currentXRange[0] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
                Math.min(currentXRange[1] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowUp': // 위쪽 방향키
            newYRange = [
                Math.min(currentYRange[0] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
                Math.min(currentYRange[1] + keystep, prjManager.canvasSizeVar.canvasRangeLimit[3]),
            ];
            break;
        case 'ArrowDown': // 아래쪽 방향키
            newYRange = [
                Math.max(currentYRange[0] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
                Math.max(currentYRange[1] - keystep, prjManager.canvasSizeVar.canvasRangeLimit[2]),
            ];
            break;
        default:
            return; // 다른 키는 무시
    }

    // X, Y축 범위 업데이트

    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });
}







function elem_toggleHidden(clickedid) {

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
    canvasResize([], prjManager)
}

