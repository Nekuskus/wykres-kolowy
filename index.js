function random(min, max) { // obie strony inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function zip(arr1, arr2, arr3) {
    if(arr1.length != arr2.length) {
        throw new Error('zip(): Tablice są różnych długości')
    }
    if(arr3) {
        if (arr2.length != arr3.length) {
            throw new Error('zip(): Tablice są różnych długości')
        }
        return arr1.map((el, i) => {
            return {data: el, color: arr2[i], offset: arr3[i]}
        })
    }
    return arr1.map((el, i) => {
        return {data: el, color: arr2[i]}
    })
}

function number_in(lowerBound, upperBound, n) {
    return n >= lowerBound && n <= upperBound;
}

function kolor_eq(kolor1, kolor2) {
    return kolor1.r == kolor2.r && kolor1.g == kolor2.g && kolor1.b == kolor2.b
}

/**
 * @param {[{name: string, value: number, offset: number|[number, number]?}]} dane
 * @param {[{r: number, g: number, b: number}]} kolory
 * @param {number} startAngle
 * @param {boolean} valCaption
 * @param {boolean} legend
 * @param {(string | [boolean])} offset
 * @param {boolean} displayChartText
 * @param {boolean} displayChartPercentage
 * @param {boolean} sorted
 * @param {boolean} sortedDescending
 */
function wykres(dane , kolory, startAngle = 0, valCaption = true, legend = true, /* arguments after this bar have not yet been fully implemented! */ offset = '', /* arguments before this bar have not yet been fully implemented! */ displayChartText = !(legend || valCaption), displayChartPercentage = !displayChartText, sorted = false, sortedDescending = true) {

    const out = document.getElementById('canvasroot')

    const { width, height } = out.getBoundingClientRect();

    const ctx = out.getContext('2d')

    ctx.imageSmoothingEnabled = true;

    /* error checking */
    if(!dane) {
        console.error("wykres(): Brak danych, wyświetlanie pustego koła")
        ctx.beginPath()
        ctx.moveTo(width * 0.75, height * 0.5)
        if(kolory) ctx.strokeStyle = `rgb(${kolory[0].r}, ${kolory[0].g}, ${kolory[0].b})`
        else ctx.strokeStyle = '#0000000'

        ctx.arc(width * 0.5, height * 0.5, width * 0.25, 0, 2 * Math.PI)
        ctx.stroke()
        return 0;
    }

    if (dane.length > 360) {
        console.error("wykres(): Za dużo danych, nie można wyświetlić")
        return 0;
    }

    function compareDataDescending(a, b) {
        return b.value - a.value
    }

    function compareDataAscending(a, b) {
        return a.value - b.value
    }

    if(sorted) {
        dane.sort(sortedDescending ? compareDataDescending : compareDataAscending)
    }

    /* inicjalizacja danych */

    if(!kolory) {
        kolory = [{r: random(0, 255), g: random(0, 255), b: random(0, 255)}]
    }


    function getNewColor() {
        let kolor = {r: random(0, 255), g: random(0, 255), b: random(0, 255)}
        if(kolory.some((el) => kolor_eq(el, kolor))) {
            do {
                kolor = {r: random(0, 255), g: random(0, 255), b: random(0, 255)}
                //console.debug(kolor)
            } while (kolory.some((el) => kolor_eq(el, kolor)))
        }
        return kolor
    }

    while (kolory.length < dane.length) {
        kolory.push(getNewColor())
    }
    
    //console.debug(dane)
    //console.debug(kolory)

    for (let i = 0; i < kolory.length; i++) {
        for(let j = 0; j < kolory.length; j++) {
            if(i != j && kolor_eq(kolory[i], kolory[j])) {
                let newColor = getNewColor()
                console.error(`wykres(): Powtórzony kolor rgb(${kolory[i].r}, ${kolory[i].b}, ${kolory[i].g})\nZastąpiony przez rgb(${newColor.r},${newColor.g},${newColor.b})`)
                kolory[i] = newColor
            }
            //return 0;
        }
    }
    let valuesum = dane.reduce((res, el) => {
        return res + el.value
    }, 0)

    //console.debug(valuesum)

    function getValue(item) {
        return item.value
    }
    let dataValues = dane.map(getValue)
    let largestIndex = dataValues.indexOf(Math.max(...dataValues))

    let addedSum = 0

    dane = dane.map((el) => {
        el.arc = (el.value / valuesum) >= 1/360 ? el.value / valuesum : (() => {
            console.error(`wykres(): Wartość ${el.value} jest za mała aby wyświetlić. Łuk zastąpiony przez 1/360.`)
            addedSum += (1/360 - el.value / valuesum)
            return 1/360
        })()
        return el
    })

    dane[largestIndex].value -= addedSum;
    
    //console.debug(zip(dane, kolory))

    if(typeof(offset) == 'string') {
        let offsetList = offset.split('')
        offset = offsetList.map((el) => el === '1')
        while(offset.length < dane.length) {
            offset.push(false)
        }
    }

    let lastOffset = 'none'

    console.debug(offset)

    /* rysowanie */

    //ctx.beginPath()

    //let def_width = ctx.lineWidth
    //ctx.lineWidth = 10

    ctx.font = '30px Consolas'

    let origin_x = width > height ? ((legend || valCaption) ? width / 3 : width * 0.5) : width * 0.5
    let origin_y = width > height ? height * 0.5 : ((legend || valCaption) ? height / 3 : height * 0.5)

    let radius = (origin_x < origin_y ? origin_x : origin_y) * 0.5


    //ctx.arc(origin_x, origin_y, radius, 0, Math.PI * 2)

    //ctx.stroke()

    //ctx.lineWidth = def_width
    let curAngle = startAngle;

    let percentageTextLog = []
    let nameTextLog = []

    let zipList = [dane, kolory]
    if(offset) zipList.push(offset)

    zip(...zipList).forEach(item => {
        ctx.beginPath()

        let local_x = origin_x
        let local_y = origin_y

        ctx.fillStyle = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`

        let prevAngle = curAngle
        curAngle += 2 * Math.PI * item.data.arc

        let startAngleDeg = startAngle * 180 / Math.PI

        let middleAngle = (prevAngle + curAngle) / 2
        let normalisedMiddleAngle = middleAngle - prevAngle - startAngle

        // these two are mainly for debugging purposes
        let middleAngleDeg = middleAngle * 180 / Math.PI
        let normalisedMiddleAngleDeg = normalisedMiddleAngle * 180 / Math.PI

        let vector_x = Math.cos(middleAngle) * (radius / 1.7)
        let vector_y = Math.sin(middleAngle) * (radius / 1.7)

        /* Obsolete

        // Rotate around (local_x, local_y)

        //let rot_x = vector_x * Math.cos(0) - vector_y * Math.sin(0)
        //let rot_y = vector_x * Math.sin(0) + vector_y * Math.cos(0)

        //console.log(`\n${vector_x}, ${vector_y}`)
        //console.log(`${rot_x}, ${rot_y}`)

        */


        if (item.offset){
            if (item.data.offset) {
                if(Array.isArray(item.data.offset)) {
                    local_x += item.data.offset[0]
                    local_y += item.data.offset[1]
                } else if(typeof(item.data.offset) === 'number') {
                    let offset_x = Math.cos(middleAngle) * (item.data.offset)
                    let offset_y = Math.sin(middleAngle) * (item.data.offset)
                    local_x += offset_x
                    local_y += offset_y
                }
                lastOffset = item.data.offset
            } else {
                if(lastOffset !== 'none') {
                    if(Array.isArray(lastOffset)) {
                        // Najgorszy przypadek, bo nie zachodzi żadna rotacja
                        local_x += lastOffset[0]
                        local_y += lastOffset[1]
                    } else if(typeof(lastOffset) === 'number') {
                        let offset_x = Math.cos(middleAngle) * (lastOffset)
                        let offset_y = Math.sin(middleAngle) * (lastOffset)
                        local_x += offset_x
                        local_y += offset_y
                    }
                }
            }
        }

        ctx.moveTo(local_x, local_y)

        ctx.arc(local_x, local_y, radius, prevAngle, curAngle)

        //console.log(curAngle)
        ctx.stroke()
        ctx.fill()

        //console.debug(`prevAngle: ${prevAngle * (180 / Math.PI)}`)
        //console.debug(`middleAngle: ${middleAngle * (180 / Math.PI)}`)
        //console.debug(`curAngle: ${curAngle * (180 / Math.PI)}`)
        //console.debug(`vec: [${rot_x}, ${rot_y}]`)

        let percentage = (item.data.value / valuesum * 100).toFixed(1) + '%'

        let percentageMetrics = ctx.measureText(percentage)
        let percentageWidth = percentageMetrics.width
        let percentageHeight = percentageMetrics.actualBoundingBoxAscent + percentageMetrics.actualBoundingBoxDescent
        let nameMetrics = ctx.measureText(item.data.name)
        let nameWidth = nameMetrics.width
        let nameHeight = nameMetrics.actualBoundingBoxAscent + nameMetrics.actualBoundingBoxDescent

        console.debug(`name ${item.data.name}`)
        console.debug(`percentage ${percentage}`)
        console.debug(`startAngleDeg ${startAngleDeg}`)
        console.debug(`middleAngleDeg ${middleAngleDeg}`)
        nameTextLog.push({
            text: item.data.name,
            x1: local_x + vector_x - nameWidth / 2,
            y1: local_y + vector_y
        })
        percentageTextLog.push({
            text: percentage,
            x1: displayChartText && displayChartText ? local_x + vector_x * 1.5 : local_x + vector_x,
            y1: displayChartText && displayChartText ? local_y + vector_y * 1.5 : local_y + vector_y,
            x2: local_x + vector_x * 2,
            y2: local_y + vector_y * 2,
            x3: local_x + vector_x * 2.25 + (
                number_in(0, 30, middleAngleDeg - 360*Math.floor(middleAngleDeg/360)) ? - percentageWidth / 2 + 2 * Math.sqrt(vector_x):
                number_in(330, 360, middleAngleDeg - 360*Math.floor(middleAngleDeg/360)) ? - percentageWidth / 2 + 2 * Math.sqrt(vector_x):
                number_in(165, 200, middleAngleDeg - 360*Math.floor(middleAngleDeg/360)) ? - percentageWidth / 2 - 2 * Math.sqrt(-vector_x): // - percentageWidth * 0.7 :
                -percentageWidth / 2
            ),
            y3: local_y + vector_y * 2.25 + percentageHeight / 2})
    })

    if(displayChartText) {
        nameTextLog.forEach((item) => {
            ctx.beginPath()
            //ctx.moveTo(item.x1, item.y1)
            ctx.fillStyle = `rgb(0, 0, 0)`
            ctx.fillText(item.text, item.x1, item.y1)
            ctx.stroke()
        })
    }

    if(displayChartPercentage) {
        percentageTextLog.forEach((item) => {
            ctx.beginPath()
            ctx.moveTo(item.x1, item.y1)
            ctx.lineWidth = 3
            ctx.fillStyle = `rgb(0, 0, 0)`
            //ctx.fillText(item.text, item.x, item.y)
            ctx.lineTo(item.x2, item.y2)
            //console.debug(item.text)
            ctx.fillText(item.text, item.x3, item.y3)
            ctx.stroke()
        })
    }

    let l_origin_x = (width > height ? width * 0.75 : width * 0.1)
    let l_origin_y = (width > height ? height * 0.2 : height * 0.65)

    function string_length(str) {
        return str.length
    }

    let percentageList = []
    dane.forEach((item) => {
        percentageList.push((item.value / valuesum * 100).toFixed(1) + '%')
    })
    let textLength = percentageList.map(string_length)
    //console.log(percentageList)
    //console.log(textLength)

    let spaceMax = Math.max(...textLength)


    if(legend && valCaption) {
        ctx.beginPath()
        ctx.moveTo(l_origin_x, l_origin_y)
        let cur_y = l_origin_y
        zip(dane, kolory).forEach((item) => {
            ctx.fillStyle = `rgb(0, 0, 0)`
            let percentageText = (item.data.value / valuesum * 100).toFixed(1) + '%'
            let str = `${item.data.name} ${percentageText}`
            let textMetrics = ctx.measureText(str)
            let textWidth = textMetrics.width
            let textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
            ctx.fillText(str, l_origin_x + 30, cur_y - textHeight + (textHeight - 21), width - l_origin_x - 30)
            ctx.fillStyle = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`

            ctx.lineWidth = 2
            ctx.rect(l_origin_x, cur_y - textHeight * 2 + 2*(textHeight - 21) + 3, 20, 21)
            ctx.fillRect(l_origin_x, cur_y - textHeight * 2 + 2*(textHeight - 21) + 3, 20, 21)

            let odstep = 10 - (textHeight - 21)
            cur_y += textHeight + odstep
        })
        ctx.stroke()
    } else if (legend) {
        ctx.beginPath()
        ctx.moveTo(l_origin_x, l_origin_y)
        let cur_y = l_origin_y
        zip(dane, kolory).forEach((item) => {
            ctx.fillStyle = `rgb(0, 0, 0)`
            let percentageText = (item.data.value / valuesum * 100).toFixed(1) + '%'
            let textMetrics = ctx.measureText(percentageText)
            let textWidth = textMetrics.width
            let textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
            ctx.fillText(percentageText, l_origin_x + 30, cur_y - textHeight + (textHeight - 21), width - l_origin_x - 30)
            ctx.fillStyle = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`

            ctx.lineWidth = 2
            ctx.rect(l_origin_x, cur_y - textHeight * 2 + 3, 20, textHeight)
            ctx.fillRect(l_origin_x, cur_y - textHeight * 2 + 3, 20, textHeight)

            let odstep = 10 - (textHeight - 21)
            cur_y += textHeight + odstep
        })
        ctx.stroke()
    } else if (valCaption) {
        ctx.beginPath()
        ctx.fillStyle = `rgb(0, 0, 0)`
        ctx.font = '30px Consolas'
        ctx.moveTo(l_origin_x, l_origin_y)
        let cur_y = l_origin_y
        dane.forEach((item) => {
            let percentageText = (item.value / valuesum * 100).toFixed(1) + '%'
            let str = `${percentageText}${' '.repeat(spaceMax - percentageText.length + 1)}- ${item.name}`
            let textMetrics = ctx.measureText(str)
            //let textWidth = textMetrics.width
            let textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
            ctx.fillText(str, l_origin_x, cur_y - textHeight + (textHeight - 21), width - l_origin_x)
            //console.error(textHeight)
            //console.error(str)
            let odstep = 10 - (textHeight - 21)
            cur_y += textHeight + odstep
        })
        ctx.stroke()

    }

    return 1;
}



//
// Playground
//


// Test Case random:
const napoje = ['Czarna', 'Zielona', 'Czerwona', 'Biała', 'Ziołowa', 'Yerba', 'Kawa', 'Oolong']

let arg = []
napoje.forEach((el) => {
    arg.push({name: el, value: random(1, 1000)})
})

wykres(/* dane: */ arg, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ true, /* displayChartPercentage: */ true, /* sorted: */ true, /* sortedDescending: */ true)


// Test Case za mały:
//wykres([{name: 'Kawa', value: 4000}, {name: 'Herbata', value: 1000}, {name: 'Yerba (osobno)', value: 2}], [], (0/180) * Math.PI, true, false, '', true, true)


// Test Case 3 wartości:
//wykres([{name: 'Kawa', value: random(100, 300)}, {name: 'Herbata', value: random(100, 200)}, {name: 'Yerba (osobno)', value: random(400, 500)}])


// Test Case 1 wartość:
//wykres([{name: 'Kawa', value: 1}], [{r: 119, g: 300, b: 130}], (0/180) * Math.PI)


// Test Case 0 wartości:
//wykres()
//wykres(undefined, [{r: random(0, 255), g: random(0, 255), b: random(0, 255)}])


// Test Case obracanie [(kąt / 180) * Math.PI]:
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (0 / 180) * Math.PI)
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (30 / 180) * Math.PI)
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (60 / 180) * Math.PI)
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (90 / 180) * Math.PI)
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (180 / 180) * Math.PI)
//wykres([{name: 'Kawa', value: 300}, {name: 'Herbata', value: 400}, {name: 'Yerba (osobno)', value: 100}], [], (360 / 180) * Math.PI)

let arg2 = []
napoje.forEach((el) => {
    arg2.push({name: el, value: el == 'Oolong' || el == 'Yerba' ? 50 : 100})
})


// Test Case legenda:
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ false, false)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ false, /* offset: */ '', /* displayChartText: */ false, false)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ false, /* legend: */ true, /* offset: */ '', /* displayChartText: */ false, false)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ false, /* legend: */ false, /* offset: */ '', /* displayChartText: */ false, false)


// Test Case opisy na wykresie:
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ true, true)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ false, true)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ true, false)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '', /* displayChartText: */ false, false)


// Test Case offset (jeśli jakaś część wykresu ma przyjąć offset, a nie ma podanej wartości offsetu w danych, przyjmie wartość poprzednią):

arg2[0].offset = 30
arg2[4].offset = 55

arg2[7].offset = [120, -10]
arg2[5].offset = [0, -100]

//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ '11011', /* displayChartText: */ true, true)
//wykres(/* dane: */ arg2, /* kolory: */[], /* startAngle: */(0/180) * Math.PI, /* valCaption: */ true, /* legend: */ true, /* offset: */ [false, false, false, false, false, true, false, true], /* displayChartText: */ true, true)


// Test Case 360 wartości

arg3 = []
for(let i = 0; i < 360; i++) {
    arg3.push({name: 'a', value: 1})
}

//wykres(arg3, [], 0, false, false, '', false, false, false, false)