

// sub functions =================================================================================================================
// ===============================================================================================================================

function sub_XY2pos(XY) {
    return XY[0]*1000 + XY[1]
}
function sub_pos2XY(pos) {
    return [Math.floor(pos/1000), pos%1000]
}


function sub_validityCheck(prjManager) {

    // canvas range limit check
    const XY = prjManager.uiStatus.hoverPoint;
    const rangeLim = prjManager.canvasSizeVar.canvasRangeLimit
    if ( (XY[0] <= rangeLim[0]) || (XY[0] >= rangeLim[1]) || (XY[1] <= rangeLim[0]) || (XY[1] >= rangeLim[1]) ) return false

    // empty element array check
    if (Object.keys(prjManager.data.element).length == 0) return true

    // validity check 
    // map (xy2eid,name) 에서 XYID로 색인하자. 근데 slave도 같이 해서. slave는 node랑 만났을 떄는 문제 없도록.
    // nodeline의 경우, 
    // 1. startpoint : element 가 있는 경우 불가, 나머지 가능
    // 2. endpoint : 끝 두 점 사이에 element가 있는 경우 불가, 나머지는 가능. 
    // (hover, create 할 땐 ctrl mode에 따라 logic 복잡)
    // 
    // 
    
    positionArray = [sub_XY2pos(XY)]
    return
    

}

function sub_createElementObject(prjManager) {

    const elementName = prjManager.createElement.name;
    const elementDefault = prjManager.circuitData.element[elementName]
    const XY = prjManager.uiStatus.hoverPoint;
    const shape = prjManager.createElement.shape;
    const shapeN = prjManager.createElement.shapeN;
    const shapeMerged = sub_shiftShapeMerged(shape, shapeN, XY);
    const terminal = prjManager.createElement.terminal;
    const paraNames = prjManager.circuitData.element[elementName].paraNames;

    

    // circuitdata에서 각 element name 별로 para 정보 및 terminal 정보를 가져오자
    // 그리고 terminal 만큼 for문을 돌려서, slave도 만들어내자. master, slave 각 eid 연결도 다 하고.
    // 그래서 master + slave 전부 합한 dict를 반환하자.
    // 그런다음 status에 맞게 circuit 그림들을 rendering 하자. (이건 이 함수 말고 밖에서)
    // 또한, 빠르게 색인 가능한 XY2eid(name) map도 만들자.
    //
    // 고민! slave (node)의 경우 dynamic하게 merge 되고 하는데, 이 경우 eid 처리를 어떻게 하지? 동일한 node를 가리키는 eid list들을 따로 만들어야 하나? 아니면 eid들을 다 수정해야 하나?


    let elementObjGroup = {};   

    // main element object
    prjManager.data.counter += 1; 
    let elementObj = {
        elementId: prjManager.data.counter,
        positionId: [sub_XY2pos(XY)],
        name: elementName,
        shape: shape,
        shapeN: shapeN,
        shapeMerged: shapeMerged,
        polarity: prjManager.createElement.polarity,
        rotation: prjManager.createElement.rotation,
        terminal: terminal,
        paraNames: paraNames,
        paraValues: null,
        elementStatus: null,
        masterId: null,
        slaveId: null,
    };
    elementObjGroup[elementObj.elementId] = elementObj;

    // terminal objects (slaves)
    for (let i = 0; i < terminal.length(); i++) {
        prjManager.data.counter += 1;
        let elementObj = {
            elementId: prjManager.data.counter,
            positionId: [sub_XY2pos(XY)],
            name: 'terminal',
            shape: null,
            shapeN: null,
            shapeMerged: null,
            polarity: null,
            rotation: null,
            terminal: null,
            para:null,
            elementStatus:null,
            masterId:null,
            slaveId:null,
        };

        elementObjGroup[elementId] = elementObj

      }
      


    console.log("elementObj:", elementObj)

    // map update
    let mapInfo = {[elementObj.positionId]: elementObj.elementId}
    console.log(mapInfo)



    


}

function sub_rerangeCanvas(prjManager) {
    // 플롯의 실제 크기 가져오기

    const plot = prjManager.plotObject.canvas._fullLayout;
    const width = plot.width;  // 플롯 내부 너비
    const height = plot.height; // 플롯 내부 높이

    // 현재 X, Y축의 범위 가져오기
    const currentLayout = prjManager.plotObject.canvas.layout;
    const currentXRange = currentLayout.xaxis.range; // [xmin, xmax]
    const currentYRange = currentLayout.yaxis.range; // [ymin, ymax]

    // 현재 중심 계산
    const xCenter = (currentXRange[0] + currentXRange[1]) / 2;
    const yCenter = (currentYRange[0] + currentYRange[1]) / 2;

    // 새로운 X, Y축 범위 계산 (중심 기준)
    const xRange = width / prjManager.canvasSizeVar.pixelsPerUnit / 2;
    const yRange = height / prjManager.canvasSizeVar.pixelsPerUnit / 2;

    const newXRange = [
        Math.max(xCenter - xRange, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(xCenter + xRange, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];
    const newYRange = [
        Math.max(yCenter - yRange, prjManager.canvasSizeVar.canvasRangeLimit[2]),
        Math.min(yCenter + yRange, prjManager.canvasSizeVar.canvasRangeLimit[3])
    ];

    // Plotly의 축 범위 업데이트
    prjManager.plotObject.Plotly.relayout('canvas', {
        'xaxis.range': newXRange,
        'yaxis.range': newYRange
    });

}

function sub_roundXY(event,prjManager, deg=2, bound=true) {
    
    let roundX, roundY
    const canvas = prjManager.plotObject.canvas;
    let rect = canvas.getBoundingClientRect();
    let startX = event.clientX - rect.left;
    let startY = event.clientY - rect.top;
    const plotLayout = canvas._fullLayout;
    const pntX =  plotLayout.xaxis.range[0] + (startX / plotLayout.width) * (plotLayout.xaxis.range[1] - plotLayout.xaxis.range[0])
    const pntY =  plotLayout.yaxis.range[1] - (startY / plotLayout.height) * (plotLayout.yaxis.range[1] - plotLayout.yaxis.range[0])

    if (deg == 0) {
        roundX = pntX;
        roundY = pntY;
    } else {
        roundX = Math.round((pntX - deg) / deg) * deg + deg;
        roundY = Math.round((pntY - deg) / deg) * deg + deg;
    }

    if (!bound) {
        const currentLayout = prjManager.plotObject.canvas.layout;
        const currentXRange = currentLayout.xaxis.range;
        const currentYRange = currentLayout.yaxis.range;
        roundX = Math.max(roundX, Math.min(currentXRange[0], currentXRange[1]));
        roundY = Math.max(roundY, Math.min(currentYRange[0], currentYRange[1]));
    }

    return [roundX,roundY]
}

function sub_shiftShapeMerged(shape, shapeN, offset) {
    let shapeShifted = sub_shiftShape(shape, offset);
    let shapeNShifted = sub_shiftShape(shapeN, offset);
    let shapeMerged = [[...shapeShifted[0], null, ...shapeNShifted[0]],[...shapeShifted[1], null, ...shapeNShifted[1]]];
    return shapeMerged
}

function sub_shiftShape(shape, offset) {
    if (shape.length == 0) return [[null], [null]];
    let [mouseX,mouseY] = offset
    const [shapeX, shapeY] = shape;
    const Xdata = shapeX.map((val) => val === null ? null : val + mouseX);
    const Ydata = shapeY.map((val) => val === null ? null : val + mouseY);
    return [Xdata, Ydata]
}


// function sub_rotateVectors(shapeXY, polarity, rotation) {
//     let [X,Y] = shapeXY
//     if (polarity == 1) { X = X.map(num => -num)}
//     if (rotation == 0) {
//         return [X,Y]}
//     else {
//         if (rotation == 1) { a=0; b=1; c=-1; d=0; }
//         else if (rotation == 2) { a=-1; b=0; c=0; d=-1; }
//         else if (rotation == 3) { a=0; b=-1; c=1; d=0; }
//         const Xr = X.map((x, i) => x === null || Y[i] === null ? null : a * x + b * Y[i]);
//         const Yr = Y.map((y, i) => X[i] === null || y === null ? null : c * X[i] + d * y);
//         return [Xr, Yr];
//     }
// }

function sub_rotateVectors(shapeXY) {
    let [X,Y] = shapeXY
    a=0; b=1; c=-1; d=0;
    const Xr = X.map((x, i) => x === null || Y[i] === null ? null : a * x + b * Y[i]);
    const Yr = Y.map((y, i) => X[i] === null || y === null ? null : c * X[i] + d * y);
    return [Xr, Yr];
}
function sub_flipVectors(shapeXY) {
    let [X,Y] = shapeXY
    X = X.map(num => -num)
    return [X,Y];
}