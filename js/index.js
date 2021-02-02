let model;
let canvas;
let categoryNames = [];
let drawingCoordinates = [];
let mousePressed = false;

// credit to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil#Decimal_adjustment
(function () {
    /**
     * Decimal adjustment of a number.
     *
     * @param {String}  type  The type of adjustment.
     * @param {Number}  value The number.
     * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
     * @returns {Number} The adjusted value.
     */

    function decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }

        value = +value;
        exp = +exp;

        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }

        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));

        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    // Decimal round
    if (!Math.round10) {
        Math.round10 = function (value, exp) {
            return decimalAdjust('round', value, exp);
        };
    }

    // Decimal floor
    if (!Math.floor10) {
        Math.floor10 = function (value, exp) {
            return decimalAdjust('floor', value, exp);
        };
    }

    // Decimal ceil
    if (!Math.ceil10) {
        Math.ceil10 = function (value, exp) {
            return decimalAdjust('ceil', value, exp);
        };
    }
})();

// initialize the canvas
$(function () {
    canvas = window._canvas = new fabric.Canvas('c');

    canvas.backgroundColor = '#FFD700';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = 'black';
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();

    canvas.on('mouse:up', function (event) {
        if (canvas.isDrawingMode) {
            performPrediction();
        }
        mousePressed = false;
    });

    canvas.on('mouse:down', function (event) {
        mousePressed = true;
    });

    canvas.on('mouse:move', function (event) {
        let pointer = canvas.getPointer(event.e);

        if (pointer.x >= 0 && pointer.y >= 0 && mousePressed) {
            drawingCoordinates.push(pointer);
        }
    });
});

// loading the model
async function loadModel() {
    const MODEL_URL = 'tensorflow/web_model/tensorflowjs_model.pb';
    const WEIGHTS_URL = 'tensorflow/web_model/weights_manifest.json';

    console.log("...loading model...");
    model = await tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL);
    console.log("model loaded.");

    console.log("...warming up...");
    const ones = tf.ones([1, 28, 28, 1]);
    model.execute(ones).print(true);

    // Load the category names
    await loadCategories();

    // Enable drawing on the canvas
    canvas.isDrawingMode = 1;
}

// loading category names
async function loadCategories() {
    let filename = 'tensorflow/web_model/categories.txt';

    await $j.ajax({
        url: filename,
        dataType: 'text',
    }).done(function (data) {
        categoryNames = data.split(/\n/);
    });
}

// erasing the canvas
function eraseCanvas() {
    canvas.clear();
    canvas.backgroundColor = '#FFD700';
    drawingCoordinates = [];
}

// performing prediction
function performPrediction() {
    if (drawingCoordinates.length >= 2) {
        const imageData = getImageData();

        // Get the prediction
        const y_output = model.execute(distort(imageData));
        const probabilities = y_output.dataSync();

        console.log("Model output tensor: ");
        y_output.print(true);
        console.log("Probabilities: ", probabilities);

        // Map the probabilities to indices
        const indices = probabilities.slice(0).sort(function (a, b) {
            return b - a
        }).map(function (probability) {
            for (let i = 0; i < probabilities.length; i++) {
                if (probability === probabilities[i]) {
                    return i;
                }
            }
        });

        let predictionText = '';

        for (let i = 0; i < 1; i++) {
            let index = indices[i];
            let p = Math.round10(probabilities[index] * 100, -2);

            if (i === 0)
                predictionText += '<span style="font-size: 1rem; font-weight: bold;">';
                predictionText += 'nah... that is a(n) '
                predictionText += '</span>';
                predictionText += '<span style="font-size: 2rem; color:#ef6c00; font-weight: bold;">';
                predictionText += categoryNames[index];
                predictionText += '<span style="font-size: 1rem"> (';
                predictionText += p;
                predictionText += '% match)</span>';

            if (i === 0)
                predictionText += '</span>';

            // If we get the most perfect matching
            if (p === 100)
                break;

            if (i < 1 - 1)
                predictionText += ' > ';
        }

        document.getElementById('console').innerHTML = predictionText;
    }
}

function getImageData() {
    // Get the border box around the drawing
    const box = getBorderBox();

    // Get the image data according to DPI
    const dpi = window.devicePixelRatio;

    return canvas.contextContainer.getImageData(box.topLeft.x * dpi, box.topLeft.y * dpi,
        (box.bottomRight.x - box.topLeft.x + 1) * dpi, (box.bottomRight.y - box.topLeft.y + 1) * dpi);
}

function getBorderBox() {
    let coordinateXs = drawingCoordinates.map(function (pointer) {
        return pointer.x
    });
    
    let coordinateYs = drawingCoordinates.map(function (pointer) {
        return pointer.y
    });

    // Get the (top, left) and (bottom, right) points.
    let topLeftCoordinate = {
        x: Math.min(...coordinateXs),
        y: Math.min(...coordinateYs)
    };

    let bottomRightCoordinate = {
        x: Math.max(...coordinateXs),
        y: Math.max(...coordinateYs)
    };

    return {
        topLeft: topLeftCoordinate,
        bottomRight: bottomRightCoordinate
    }
}

function distort(imageData) {
    return tf.tidy(function () {
        // The shape is (h, w, 1)
        let tensor = tf.fromPixels(imageData, numChannels = 1);

        // Resize to 28x28 and normalize to 0 (black) and 1 (white)
        let normalizedImage = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
        normalizedImage = tf.ceil(normalizedImage.div(tf.scalar(255.0)));

        // Add a dimension to get a batch shape so that the shape will become (1, h, w, 1)
        return normalizedImage.expandDims(0);
    })
}