# Upload API 接口文档

## 1. 接口概述

该接口用于批量上传并解析生物序列文件。接口会并行处理本次请求中的文件，并在所有文件处理结束后一次性返回各文件的解析结果。

- 请求方法：`POST`
- 请求路径：`/upload/`
- Content-Type：`multipart/form-data`
- 支持批量上传：是
- 最大并行处理数：8

## 2. 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `files` | File[] | 是 | 无 | 待解析的文件。同一个字段可以传递多个文件。 |
| `type` | String | 是 | 无 | 数据类型，可选值为 `plasmid`、`backbone`、`part`。 |
| `save_feature` | Boolean/String | 否 | `false` | 是否保留 feature 的兼容参数。真值可以传 `true`、`1`、`yes` 或 `on`，不区分大小写。当前实现始终解析并返回文件中的 feature。 |

### 2.1 支持的文件类型

| 扩展名 | 文件格式 | 读取方式 |
| --- | --- | --- |
| `.fasta` | FASTA | 文本 |
| `.gb` | GenBank | 文本 |
| `.gbk` | GenBank | 文本 |
| `.ape` | GenBank/ApE | 文本 |
| `.str` | GenBank | 文本 |
| `.dna` | SnapGene DNA | 二进制 |

文本文件依次尝试使用 `UTF-8`、`UTF-8 with BOM`、`GB18030`、`GBK` 和 `Latin-1` 解码。

### 2.2 文件名处理规则

- 文件扩展名会转换为小写。
- 返回数据中的 `name` 来自文件主文件名。
- `name` 最多保留前 20 个字符。

## 3. 请求示例

### 3.1 cURL：上传单个文件

```bash
curl -X POST "http://localhost:8000/upload/" \
  -F "files=@Ta046.gbk" \
  -F "type=plasmid" \
  -F "save_feature=true"
```

### 3.2 cURL：上传多个文件

```bash
curl -X POST "http://localhost:8000/upload/" \
  -F "files=@Ta046.gbk" \
  -F "files=@another.gbk" \
  -F "type=plasmid" \
  -F "save_feature=true"
```

### 3.3 JavaScript

```javascript
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('type', 'plasmid')
formData.append('save_feature', 'true')

const response = await fetch('/upload/', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
```

不要手动设置 `Content-Type` 请求头；浏览器会自动生成包含 boundary 的 `multipart/form-data` 请求头。

## 4. 成功响应

只要请求被正常接收并完成批量处理，HTTP 状态码为 `200`。顶层 `success` 表示本次请求中的所有文件是否都处理成功。

```json
{
  "success": true,
  "total": 1,
  "results": [
    {
      "success": true,
      "data": {
        "name": "Ta046",
        "sequence": "CCTCCTTAAAAAGGAG...",
        "ori": [],
        "marker": ["gmr marker"],
        "bsmbi": "-",
        "bsai": "-",
        "bbsi": "-",
        "aari": "-",
        "sapi": "-",
        "feature": [
          {
            "start_position": 76,
            "end_position": 787,
            "label": "mCherry",
            "feature_type": "CDS",
            "color": "#83ff83",
            "ape_info": "#83ff83"
          }
        ]
      }
    }
  ]
}
```

### 4.1 顶层响应字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | Boolean | 所有文件均成功时为 `true`；任意文件失败时为 `false`。 |
| `total` | Integer | 本次请求处理的文件总数。 |
| `results` | Array | 文件处理结果，顺序与请求中的文件顺序一致。 |

### 4.2 单文件成功结果

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | Boolean | 当前文件是否处理成功。 |
| `data` | Object | 当前文件解析得到的数据。 |

## 5. 不同 type 的 data 字段

### 5.1 `plasmid` 和 `backbone`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | String | 文件名，不含扩展名，最长 20 个字符。 |
| `sequence` | String | 完整 DNA 序列。 |
| `ori` | String[] | 识别出的复制起点名称。 |
| `marker` | String[] | 识别出的筛选标记名称。 |
| `bsmbi` | String/Number | BsmBI 酶切识别结果；未识别时通常为 `-`。 |
| `bsai` | String/Number | BsaI 酶切识别结果；未识别时通常为 `-`。 |
| `bbsi` | String/Number | BbsI 酶切识别结果；未识别时通常为 `-`。 |
| `aari` | String/Number | AarI 酶切识别结果；未识别时通常为 `-`。 |
| `sapi` | String/Number | SapI 酶切识别结果；未识别时通常为 `-`。 |
| `feature` | Feature[] | 文件中的 feature 注释。`source` 类型不会返回。 |

### 5.2 `part`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | String | 文件名，不含扩展名，最长 20 个字符。 |
| `Level0Sequence` | String | 根据 BsaI/BbsI 位点和接头裁剪后的 Level 0 序列。未找到成对位点时返回完整序列。 |
| `type` | String | 当前固定返回 `promoter`。 |
| `feature` | Feature[] | 完整落在裁剪区间内的 feature；坐标会转换为裁剪后序列的相对坐标。 |

## 6. Feature 对象

```json
{
  "start_position": 76,
  "end_position": 787,
  "label": "mCherry",
  "feature_type": "CDS",
  "color": "#83ff83",
  "ape_info": "#83ff83"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `start_position` | Integer | feature 起始坐标。当前使用 Biopython 的 0-based 坐标。 |
| `end_position` | Integer | feature 结束坐标，采用右开区间，即 `[start_position, end_position)`。 |
| `label` | String | feature 标签；原文件没有 `label` 时为空字符串。 |
| `feature_type` | String | feature 类型，例如 `CDS`、`promoter`、`terminator`、`RBS`。 |
| `color` | String/Null | feature 颜色。优先读取 `color` qualifier，否则尝试从 `note` 中提取。 |
| `ape_info` | String/Null | ApE 正向颜色；没有 `ApEinfo_fwdcolor` 时使用 `color`。 |

## 7. 部分失败响应

多个文件中只要有一个失败，HTTP 状态仍为 `200`，但顶层 `success` 为 `false`。成功文件和失败文件都会出现在 `results` 中。

```json
{
  "success": false,
  "total": 2,
  "results": [
    {
      "success": true,
      "data": {
        "name": "Ta046",
        "sequence": "CCTCCTTAAAAAGGAG...",
        "feature": []
      }
    },
    {
      "success": false,
      "file_name": "broken_file",
      "message": "文件解析失败原因"
    }
  ]
}
```

### 单文件失败字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | Boolean | 固定为 `false`。 |
| `file_name` | String | 处理失败的文件名，不含扩展名。 |
| `message` | String | 失败原因。 |

## 8. 请求级错误响应

请求方法错误、没有上传文件或请求处理过程发生异常时，接口返回 HTTP `400`。

### 8.1 业务参数错误

```json
{
  "success": false,
  "error_code": "labdatabase_error",
  "message": "未选择上传文件"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | Boolean | 固定为 `false`。 |
| `error_code` | String | 业务错误代码。默认值为 `labdatabase_error`。 |
| `message` | String | 错误说明。 |
| `details` | Any | 可选的错误详情。仅在异常提供详情时存在。 |

### 8.2 未捕获异常

```json
{
  "success": false,
  "message": "具体错误信息"
}
```

## 9. HTTP 状态码

| 状态码 | 说明 |
| --- | --- |
| `200` | 批量任务已处理完成。具体文件是否成功需要同时检查顶层和单文件的 `success`。 |
| `400` | 请求方法、请求参数或请求级处理错误。 |

## 10. 调用方处理建议

调用方应按以下顺序判断响应：

1. 检查 HTTP 状态码。
2. HTTP `200` 时检查顶层 `success`。
3. 遍历 `results`，分别检查每个元素的 `success`。
4. 成功结果读取 `data`，失败结果读取 `file_name` 和 `message`。

接口会等待所有上传文件处理结束后才返回。上传大量或较大的文件时，调用方应配置足够的 HTTP 超时时间。
