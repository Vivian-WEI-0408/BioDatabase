from django.shortcuts import render
from django.http import JsonResponse,FileResponse
from django.views.decorators.csrf import csrf_exempt
from .CacheInfo import CacheClass
import uuid
from django.core.cache import cache
import re
import threading
from .LabDatabaseException import LabDatabaseException
import io
from .map_processor import process_map_file
from concurrent.futures import ThreadPoolExecutor



TASK_STATUS_PREFIX = 'file_task_'
TASK_STATUS_LOCK = threading.Lock()
TEXT_MAP_FILE_TYPES = {"fasta", "gb", "gbk", "ape", "str"}
BINARY_MAP_FILE_TYPES = {"dna"}
TEXT_ENCODINGS = ("utf-8", "utf-8-sig", "gb18030", "gbk", "latin-1")

def _build_map_file_object(file_content: bytes, file_type: str):
    try:
        file_type = (file_type or "").lower()
    
        if file_type in BINARY_MAP_FILE_TYPES:
            return io.BytesIO(file_content)

        if file_type in TEXT_MAP_FILE_TYPES:
            if _looks_like_binary(file_content):
                raise LabDatabaseException(message=f".{file_type} 不是文本类文件")
                # raise ValueError(f".{file_type} file looks like binary content and cannot be parsed as text.")
            return io.StringIO(_decode_uploaded_text(file_content))

        if _looks_like_binary(file_content):
            return io.BytesIO(file_content)
        return io.StringIO(_decode_uploaded_text(file_content))
    except Exception as exc:
        raise exc
    
def _looks_like_binary(content: bytes) -> bool:
    if not content:
        return False
    if b"\x00" in content:
        return True

    sample = content[:1024]
    text_bytes = set(range(32, 127)) | {9, 10, 13}
    non_text_count = sum(1 for byte in sample if byte not in text_bytes)
    return non_text_count / max(len(sample), 1) > 0.30

def _decode_uploaded_text(content: bytes) -> str:
    last_error = None
    for encoding in TEXT_ENCODINGS:
        try:
            return content.decode(encoding)
        except UnicodeDecodeError as exc:
            last_error = exc

    if last_error is not None:
        raise ValueError(
            "Unable to detect uploaded file encoding. Please save the file as UTF-8, GBK, or GB18030 and try again."
        ) from last_error
    raise ValueError("Uploaded file is empty or cannot be decoded.")



    
@csrf_exempt
def UploadMap(request):
    try:
        if request.method != "POST":
            raise LabDatabaseException(message="请求方法错误")

        files = request.FILES.getlist("files")
        if not files:
            raise LabDatabaseException(message="未选择上传文件")

        upload_type = request.POST.get("type")
        save_feature = str(
            request.POST.get("save_feature", "false")
        ).lower() in {"true", "1", "yes", "on"}

        tasks = []

        with ThreadPoolExecutor(
            max_workers=min(len(files), 8)
        ) as executor:
            for uploaded_file in files:
                name, _, suffix = uploaded_file.name.rpartition(".")
                file_name = [name.strip()[:20], suffix.lower()]
                upload_content = uploaded_file.read()

                tasks.append(
                    executor.submit(
                        process_map_async,
                        upload_content,
                        file_name,
                        upload_type,
                        save_feature,
                    )
                )

            results = [task.result() for task in tasks]

        all_success = all(
            result.get("success", False)
            for result in results
        )
        print(results)

        return JsonResponse({
            "success": all_success,
            "total": len(results),
            "results": results,
        })

    except LabDatabaseException as exc:
        return exc.to_response()
    except Exception as exc:
        return JsonResponse({
            "success": False,
            "message": str(exc),
        }, status=400)
    

def process_map_async(upload_content, file_name, upload_type, save_feature=False):
    try:
        file_obj = _build_map_file_object(upload_content, file_name[1])
        return process_map_file(file_obj, file_name, upload_type)
    except LabDatabaseException as exc:
        return {"success": False,
            "file_name": file_name[0],
            "message": str(exc),}
    except Exception as exc:
        return {"success": False,
            "file_name": file_name[0],
            "message": str(exc),}
