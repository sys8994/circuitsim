

// sub functions =================================================================================================================
// ===============================================================================================================================

function sub_XY2pos(XY) {
    return XY[0]*1000 + XY[1]
}
function sub_pos2XY(pos) {
    return [Math.floor(pos/1000), pos%1000]
}


function sub_validityCheck(XY,prjManager) {

    // canvas range limit check
    const rangeLim = prjManager.canvasSizeVar.canvasRangeLimit
    if ( (XY[0] <= rangeLim[0]) || (XY[0] >= rangeLim[1]) || (XY[1] <= rangeLim[0]) || (XY[1] >= rangeLim[1]) ) return false

    // empry element array check
    if (prjManager.element.length == 0) return true

    positionArray = [sub_XY2pos(XY)]
    

}

function sub_createElementObject(XY,prjManager) {

    const elementName = prjManager.createElement.elementName

    elementName


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

function sub_shapeToXY(shape, offset) {

    let [mouseX,mouseY] = offset

    const [shapeX, shapeY] = shape;

    const Xdata = shapeX.map((val) => val === null ? null : val + mouseX);
    const Ydata = shapeY.map((val) => val === null ? null : val + mouseY);

    return [Xdata, Ydata]

}


function sub_rotateVectors(shapeXY, polarity, nRotation) {
    let [X,Y] = shapeXY
    if (polarity == 1) { X = X.map(num => -num)}
    if (nRotation == 0) {
        return [X,Y]}
    else {
        if (nRotation == 1) { a=0; b=1; c=-1; d=0; }
        else if (nRotation == 2) { a=-1; b=0; c=0; d=-1; }
        else if (nRotation == 3) { a=0; b=-1; c=1; d=0; }
        const Xr = X.map((x, i) => x === null || Y[i] === null ? null : a * x + b * Y[i]);
        const Yr = Y.map((y, i) => X[i] === null || y === null ? null : c * X[i] + d * y);
        return [Xr, Yr];
    }
}
