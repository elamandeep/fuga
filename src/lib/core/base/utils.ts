
import type { GlobalCSSProperties } from '$lib/@types/index.js'

import { compileString } from 'sass'
import { ExcludedProps, mixins } from './const.ts';
import { combineMap } from '$lib/@types/maps.ts';







function extractValues(value: string): string {
    return combineMap[value] || value;
}

function transformIntoCsskey(key: string) {
    let output_key = ""

    if (ExcludedProps.includes(key)) {
        let pattern = new RegExp(/[A-Z]/g)
        let upperChar = key.match(pattern)
        if (upperChar !== null) {
            let cssprop = key.replace(pattern, "")
            if (upperChar[0] === "X") {
                output_key += cssprop + "-left |"
                output_key += cssprop + "-right"
            }
            else {
                output_key += cssprop + "-top |"
                output_key += cssprop + "-bottom"

            }
        }

    }
    else if (key.includes("_")) {
        output_key += key.replaceAll("_", ":")
    }

    else {


        let pattern = new RegExp(/[A-Z]/g)
        if (pattern.test(key)) {
            let upperChar = key.match(pattern)
            if (upperChar !== null) {
                let replaceValue = `-${upperChar[0].toLocaleLowerCase()}`
                output_key += key.replace(pattern, replaceValue)
            }
        }
        else {
            output_key += key
        }
    }

    return output_key
}






function generateStyles(cssProps: Partial<GlobalCSSProperties>) {
    let style: Record<string, any> = {};
    let mediastr = ""
    let pseudostr = ""
    for (const [key, value] of Object.entries(cssProps)) {
        let new_key = extractValues(key)
        let generated_key = transformIntoCsskey(new_key)
        if (typeof value === "string") {

            let generated_value = extractValues(value)
            let key_arr = generated_key.split("|")
            for (let key in key_arr) {
                style[key_arr[key]] = generated_value
            }
        }
        else if (typeof value === "object") {
            let arr = Object.keys(value)
            let values_arr = Object.values(value)





            for (let i = 0; i < arr.length; i++) {
                let objkey = arr[i]
                let objval = values_arr[i]

                if (key.includes("_")) {
                    pseudostr += "&" + generated_key

                    let styleInsideObject: Record<string, any> = {}
                    let new_key = extractValues(objkey)
                    let k = transformIntoCsskey(new_key)

                    styleInsideObject[k] = extractValues(objval as any)
                    pseudostr += JSON.stringify(styleInsideObject)
                }

                else {
                    let styleInsideObject: Record<string, any> = {}
                    mediastr += "@include " + objkey
                    styleInsideObject[generated_key] = extractValues(objval as any)
                    mediastr += JSON.stringify(styleInsideObject)

                }
            }


        }

    }

    let cssStylestr = JSON.stringify(style).replace(/\{|\}/g, '') + ";"
    let cssString = cssStylestr + " " + mediastr + pseudostr
    cssString = cssString.replace(/"/g, '').replace(/;|,/g, ';');
    return cssString
}


function createHash(date: number) {

    return "fuga-" + Number(date).toString(36)
}



function generateSCSS<T extends Partial<GlobalCSSProperties>>(cssProps: T, tag: any) {

    let style = generateStyles(cssProps)
    let hash = createHash(Date.now())


    let globalmixins = mixins
    let css = `${globalmixins}  ${tag}.${hash} {${style}}`

    let sass = compileString(css, { silenceDeprecations: ['mixed-decls'] })
    return {
        css: sass.css, className: `${hash}`
    }

}

export { generateSCSS }