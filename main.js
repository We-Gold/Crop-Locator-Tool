// Import the css
import './style.css'

import * as tiff from "tiff"
import axios from "axios"
import { Buffer } from "buffer"

const imagePath = "./samples/5dpf_1_8bit.tif"

const response = await axios.get(imagePath,  { responseType: 'arraybuffer' })
const buffer = Buffer.from(response.data, "utf-8")

const data = tiff.decode(buffer)

console.log(data)