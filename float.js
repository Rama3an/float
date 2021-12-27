let fs = require('fs');
let arg = process.argv;

fs.readFile(arg[2], (err, input) => {
    if (err) {
        console.error(err);
        return;
    }

    function float(sign, degree, guideDigit, mantissa) {
        this.sign = sign;
        this.degree = degree;
        this.guideDigit = guideDigit;
        this.mantissa = mantissa;
    }

    let result;

    input = input.toString().split(' ');

    for (let i = 0; i < input.length; ++i) {
        if (input.length != 3 && input[i] == parseInt(input[i])) {
            result = finishFloat(new float(conv(input[i])[0], conv(input[i])[1], conv(input[i])[2], conv(input[i])[3]));
            break;
        } else if (input.length == 3 && (input[1] == '+' || input[1] == '-')) {
            let number = calc(input);
            result = finishFloat(number);
            break;
        }

    }

    fs.writeFile('output.txt', result, (err) => {
        if (err) {
            console.err(err);
            return;
        }
    });
});


function calc(input) {

    function float(sign, degree, guideDigit, mantissa) {
        this.sign = sign;
        this.degree = degree;
        this.guideDigit = guideDigit;
        this.mantissa = mantissa;
    }

    let result = new float();
    let one = input[0];
    let two = input[2];
    let oper = input[1];

    result.sign = SignBit(one, two);
    one = new float(conv(one)[0], conv(one)[1], conv(one)[2], conv(one)[3]);
    two = new float(conv(two)[0], conv(two)[1], conv(two)[2], conv(two)[3]);
    if (oper == '-' && one.sign == '0' && two.sign == '0')
        oper = '-';
    else if (oper == '-' && one.sign == '0' && two.sign == '1') {
        oper = '+';
        two.sign = '0';
    } else if (oper == '-' && one.sign == '1' && two.sign == '0') {
        two.sign = '1';
        oper = '+';
    } else if (oper == '+' && one.sign == '0' && two.sign == '1') {
        two.sign = '0';
        oper = '-';
    } else if (oper == '+' && one.sign == '1' && two.sign == '0') {
        oper = '-';
        two.sign = '1';
    }


    function mant(input) {
        return input.mantissa = input.guideDigit + input.mantissa;
    }

    mant(one);
    mant(two);

    if (parseInt(one.degree, 2) != 0 && parseInt(two.degree, 2) != 0) {
        if (one.degree == two.degree) {
            result.degree = operBin(one.degree, 1, '+');
            result.mantissa = (oper == '+') ? operMantissa(one.mantissa, two.mantissa, '+').substring(0, 23) : operMantissa(one.mantissa, two.mantissa, '-').substring(0, 23);
        } else {
            result.degree = Math.max(one.degree, two.degree).toString();
            result.mantissa = equalsDegree(one, two, oper);
        }
        if (result.degree != '00000000')
            result.guideDigit = '1';
    } else if (parseInt(one.degree, 2) == 0 || parseInt(two.degree, 2) == 0) {
        if (one.degree != 0) {
            result.degree = one.degree;
        } else
            result.degree = two.degree;
        result.mantissa = equalsDegree(one, two, oper);
    }
    return result;
}

function conv(input) {

    let float = [];
    let sign;
    let degree;
    let mantissa;
    let guideDigit = 0;

    if (input > ((2 - Math.pow(2, -23)) * Math.pow(2, 127)) || input == Infinity) {
        sign = '0';
        mantissa = '00000000000000000000000';
        degree = '11111111';
    } else if (input < -((2 - Math.pow(2, -23)) * Math.pow(2, 127)) || input == -Infinity) {
        sign = '1';
        degree = '11111111';
        mantissa = '00000000000000000000000';
    } else if (input == NaN) {
        sign = '1';
        degree = '11111111';
        mantissa = '00000000000000000000001';
    } else {
        sign = Sign(input);
        input = Math.abs(input);
        degree = Degree(input);
        mantissa = Mantissa(input.toString(2));
        guideDigit = input < Math.pow(2, -126) ? '0' : '1';
    }


    float.push(sign, degree, guideDigit, mantissa);
    return float;
}



function SignBit(one, two) {
    if ((parseInt(one, 10) + parseInt(two, 10) >= 0) || ((one - two) >= 0))
        return '0';
    else
        return '1';
}

function equalsDegree(one, two, oper) {
    let minNumber = one.degree > two.degree ? two : one;
    let maxNumber = one.degree < two.degree ? two : one;
    let minDegree = Math.min(one.degree, two.degree);
    let maxDegree = Math.max(one.degree, two.degree);
    let count = 0;
    while (minDegree != maxDegree) {
        minDegree = operBin(minDegree, '1', "+");
        count++;
    }
    for (let i = 0; i < count; ++i)
        minNumber.mantissa = '0' + minNumber.mantissa;
    minNumber.mantissa = minNumber.mantissa.substring(0, 24);

    if (oper == '+')
        return operMantissa(minNumber.mantissa, maxNumber.mantissa, '+');
    else
        return operMantissa(minNumber.mantissa, maxNumber.mantissa, '-');
}

function operMantissa(oneMantissa, twoMantissa, oper) {
    if (oper == '+')
        return operBin(oneMantissa, twoMantissa, '+').substring(operBin(oneMantissa, twoMantissa, '+').indexOf('1') + 1);
    else
        return operBin(oneMantissa, twoMantissa, '-').substring(operBin(oneMantissa, twoMantissa, '-').indexOf('1') + 1);
}

function operBin(oneBin, twoBin, oper) {
    if (oper == '+')
        return (parseInt(oneBin, 2) + parseInt(twoBin, 2)).toString(2);
    else
        return (parseInt(oneBin, 2) - parseInt(twoBin, 2)).toString(2);
}

function convDec(float) {
    let S = (float.sign == '1') ? '-' : '';
    let degree = Math.pow(2, parseInt(float.degree, 2) - 127);
    let mantissa = parseInt((float.guideDigit + float.mantissa), 2) / Math.pow(2, 23);
    return `${S}${degree * mantissa}`;
}

function finishFloat(float) {
    if (float.mantissa == '00000000000000000000001' && float.degree == '11111111')
        return `${float.sign} ${float.degree} ${float.mantissa} ≈ NaN`;
    else if (convDec(float) == 0)
        return `${float.sign} ${float.degree} ${float.mantissa}`;
    else
        return `${float.sign} ${float.degree} ${float.mantissa} ≈ ${convDec(float)}`;
}

function Sign(input) {
    return (input.toString()[0] == '-') ? '1' : '0';
}

function Degree(input) {
    if (input < Math.pow(2, -126)) {
        return '00000000';
    }
    input = Math.abs(input)
    input = input.toString(2);
    let degree;
    let indexPoint = input.indexOf(".");
    if (indexPoint == -1) {
        degree = input.length - 1;
        degree = (degree + 127).toString(2);
    } else if (indexPoint == 1 && input[0] == 0) {
        degree = indexPoint - input.indexOf(1);
        degree = (degree + 127).toString(2);
    } else {
        if (input == 0) {
            degree = -127;
            degree = (degree + 127).toString(2);
        } else {
            degree = indexPoint - 1;
            degree = (degree + 127).toString(2);

        }
    }
    if (degree.length != 8)
        while (degree.length != 8)
            degree = '0' + degree;

    return degree;

}

function Mantissa(input) {
    let mantissa = "";
    let pointSeparator = input.split(".");
    if (pointSeparator[1].length == 1 && pointSeparator[0][0] == "0") {
        if (input.length <= 1)
            for (let i = 1; i < input.length; ++i)
                if (input[i] !== ".")
                    mantissa += input[i];
                else {
                    let indexOfOne = pointSeparator[1].indexOf("1") + 1;
                    (mantissa = indexOfOne > 126)
                        ? input.substring(128, input.length)
                        : mantissa = pointSeparator[1].substring(indexOfOne);
                }
    } else {
        for (let i = 1; i < input.length; ++i)
            if (input[i] != ".")
                mantissa += input[i];
    }

    if (mantissa.length < 23)
        while (mantissa.length != 23)
            mantissa = mantissa + "0";
    else
        mantissa = mantissa.substring(0, 23);

    return mantissa;
}