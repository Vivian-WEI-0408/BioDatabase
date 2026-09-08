from Bio.SeqIO import parse, write
from Bio.Seq import Seq
import requests
import sys
import traceback
from Bio.Restriction import BsaI,BbsI
# sys.path.append(r"C:\Users\admin\Desktop\WebDatabaseBeta\WebDatabase\WebDataWorld\LabDatabase\CaculateModule")
# from .snapgene_readersnapgene_reader import snapgene_to_dict
# from .CaculateModule import snapgene_reader
from . import snapgene_reader
from .ControllerModule import FittingLabels
from .ScarIdentify import scarPosition,scarFunction
from .LabDatabaseException import LabDatabaseException


def _unique_nonempty_items(items):
    unique_items = []
    seen = set()
    for item in items or []:
        if item in [None, ""]:
            continue
        if item in seen:
            continue
        seen.add(item)
        unique_items.append(item)
    return unique_items


def _crop_feature_payload(request_body, crop_interval, source_start=None, source_end=None):
    if crop_interval is None:
        return request_body

    crop_start, crop_end = crop_interval
    source_start = source_start if source_start is not None else request_body["start_position"]
    source_end = source_end if source_end is not None else request_body["end_position"]

    if source_start > source_end or source_start < crop_start or source_end > crop_end:
        return None

    cropped_body = request_body.copy()
    cropped_body["start_position"] = source_start - crop_start + 1
    cropped_body["end_position"] = source_end - crop_start + 1
    return cropped_body


def _extract_color_from_note(note):
    if(note != None and note != ""):
        note_list = note.split(';')
        for each in note_list:
            if('color' in each):
                color = "#"+each.split('#')[-1]
                return color

def process_map_file(upload_map, file_name, upload_type):
    try:
        FeatureList = []
        if (file_name[1] == "fasta"):
            records = parse(upload_map, "fasta")
            # upload_map.seek(0)
            for record in records:
                Sequence = str(record.seq)
                break
        elif(file_name[1] == "gb" or file_name[1] == "gbk" or file_name[1] == "ape" or file_name[1] == "str"):
            # try:
            records = parse(upload_map, "genbank")
            for record in records:
                Sequence = str(record.seq)
                FeatureList = record.features
                break
            # except Exception as e:
                # traceback.print_exc()
                # return False
        elif(file_name[1] == "dna"):
            # try:
            record = snapgene_reader.snapgene_to_dict(upload_map)
            FeatureList = record['features']
            Sequence = record['seq']
            # except Exception as e:
            #     return False
        else:
            raise LabDatabaseException(message = "上传文件种类无法处理")
        
        if(Sequence != ""):
            name = file_name[0][:20]
            if(upload_type == "plasmid"):
                AddSequenceUpdateResponse = None
                Ori_list = []
                Marker_list = []
                OriAndMarkerLabel = FittingLabels(sequence= Sequence)
                for each_ori in OriAndMarkerLabel['Origin']:
                    Ori_list.append(each_ori['Name'])
                for each_marker in OriAndMarkerLabel['Marker']:
                    Marker_list.append(each_marker['Name'])
                Ori_list = _unique_nonempty_items(Ori_list)
                Marker_list = _unique_nonempty_items(Marker_list)
                scar_data_body = scarFunction(Sequence)
                #TODO: 返回数据
                request_body = {"name":name, "sequence":Sequence}
                
                #TODO: 返回数据
                request_body["ori"] = Ori_list
                request_body["marker"] = Marker_list
                #TODO: 返回数据
                request_body["bsmbi"] = scar_data_body[0]
                request_body["bsai"] = scar_data_body[1]
                request_body["bbsi"] = scar_data_body[2]
                request_body["aari"] = scar_data_body[3]
                request_body["sapi"] = scar_data_body[4]
                #TODO: 返回feature数据
                # Feature_data_body = FeatureList
                request_body["feature"] = []
                for each_feature in FeatureList:
                    start_position = each_feature.location.start
                    end_position = each_feature.location.end
                    label = each_feature.qualifiers['label'][0] if "label" in each_feature.qualifiers else ""
                    feature_type = each_feature.type
                    if(feature_type == "source"):
                        continue
                    color = each_feature.qualifiers['color'][0] if 'color' in each_feature.qualifiers else _extract_color_from_note(each_feature.qualifiers['note'][0]) if "note" in each_feature.qualifiers else ""
                    ape_info = each_feature.qualifiers['ApEinfo_fwdcolor'][0] if 'ApEinfo_fwdcolor' in each_feature.qualifiers else color
                    request_body["feature"].append({"start_position":start_position,"end_position":end_position,"label":label,"feature_type":feature_type,"color":color,"ape_info":ape_info})
                return {"success":True,"data":request_body}
            elif(upload_type == "backbone"):
                Ori_list = []
                Marker_list = []
                OriAndMarkerLabel = FittingLabels(sequence= Sequence)
                for each_ori in OriAndMarkerLabel['Origin']:
                    Ori_list.append(each_ori['Name'])
                for each_marker in OriAndMarkerLabel['Marker']:
                    Marker_list.append(each_marker['Name'])
                Ori_list = _unique_nonempty_items(Ori_list)
                Marker_list = _unique_nonempty_items(Marker_list)
                scar_data_body = scarFunction(Sequence)
                request_body = {"name":name, "sequence":Sequence}
                request_body["ori"] = Ori_list
                request_body["marker"] = Marker_list
                request_body["bsmbi"] = scar_data_body[0]
                request_body["bsai"] = scar_data_body[1]
                request_body["bbsi"] = scar_data_body[2]
                request_body["aari"] = scar_data_body[3]
                request_body["sapi"] = scar_data_body[4]
                
                request_body["feature"] = []
                for each_feature in FeatureList:
                    start_position = each_feature.location.start
                    end_position = each_feature.location.end
                    label = each_feature.qualifiers['label'][0] if "label" in each_feature.qualifiers else ""
                    feature_type = each_feature.type
                    if(feature_type == "source"):
                        continue
                    color = each_feature.qualifiers['color'][0] if 'color' in each_feature.qualifiers else _extract_color_from_note(each_feature.qualifiers['note'][0]) if "note" in each_feature.qualifiers else ""
                    ape_info = each_feature.qualifiers['ApEinfo_fwdcolor'][0] if 'ApEinfo_fwdcolor' in each_feature.qualifiers else color
                    request_body["feature"].append({"start_position":start_position,"end_position":end_position,"label":label,"feature_type":feature_type,"color":color,"ape_info":ape_info})
                return {"success":True,"data":request_body}
            elif(upload_type == "part"):
                target_seq = ""
                target_start = 1
                target_end = len(Sequence)
                Enzyme_result = BsaI.search(Seq(Sequence))
                BbsI_Enzyme_result = BbsI.search(Seq(Sequence))
                target_seq = Sequence
                if(len(Enzyme_result) == 2):
                    target_seq = Sequence[Enzyme_result[0]-1:Enzyme_result[1] - 1]
                    target_start = Enzyme_result[0]
                    target_end = Enzyme_result[1]
                else:
                    if(len(BbsI_Enzyme_result) == 2):
                        target_seq = Sequence[BbsI_Enzyme_result[0]-1 : BbsI_Enzyme_result[1] - 1]
                        target_start = BbsI_Enzyme_result[0]
                        target_end = BbsI_Enzyme_result[1]
                    else:
                        target_seq = Sequence
                if(len(Enzyme_result) == 2 or len(BbsI_Enzyme_result) == 2):
                    if(target_seq[:4].upper() == "GTGC" or target_seq[:4].upper() == "GCAC" or target_seq[:4].upper() == "ATCA"
                        or target_seq[:4].upper() == "TGAT" or target_seq[:4].upper() == "AATG" or target_seq[:4].upper() == "CATT"
                        or target_seq[:4].upper() == "TAAA" or target_seq[:4].upper() == "TTTA" or target_seq[:4].upper() == "CCTC"
                        or target_seq[:4].upper() == "GAGG"):
                        target_seq = target_seq[4:]
                        target_start = (target_start + 4) % len(target_seq)
                    if(target_seq[-4:].upper() == "GTGC" or target_seq[-4:].upper() == "GCAC" or target_seq[-4:].upper() == "ATCA"
                        or target_seq[-4:].upper() == "TGAT" or target_seq[-4:].upper() == "AATG" or target_seq[-4:].upper() == "CATT"
                        or target_seq[-4:].upper() == "TAAA" or target_seq[-4:].upper() == "TTTA" or target_seq[-4:].upper() == "CCTC"
                        or target_seq[-4:].upper() == "GAGG"):
                        target_seq = target_seq[:-4]
                        # target_end -= 4
                        target_end = (target_end - 4) % len(target_seq)
                        
                request_body = {"name":name, "Level0Sequence":target_seq}
                request_body["type"] = "promoter"
                request_body["feature"] = []
                for each_feature in FeatureList:
                    start_position = each_feature.location.start
                    end_position = each_feature.location.end
                    label = each_feature.qualifiers['label'][0] if "label" in each_feature.qualifiers else ""
                    feature_type = each_feature.type
                    if(feature_type == "source"):
                        continue
                    color = each_feature.qualifiers['color'][0] if 'color' in each_feature.qualifiers else _extract_color_from_note(each_feature.qualifiers['note'][0]) if "note" in each_feature.qualifiers else ""
                    ape_info = each_feature.qualifiers['ApEinfo_fwdcolor'][0] if 'ApEinfo_fwdcolor' in each_feature.qualifiers else color
                    to_crop_request_body = {"start_position":start_position,"end_position":end_position,"label":label,"feature_type":feature_type,"color":color,"ape_info":ape_info}

                    crop_feature = _crop_feature_payload(request_body=to_crop_request_body,crop_interval=(target_start,target_end))
                    if(crop_feature != None):
                        request_body["feature"].append(crop_feature)
                return {"success":True,"data":request_body}
            else:
                raise LabDatabaseException(message=f"上传种类未知")
        else:
            raise LabDatabaseException(message=f"上传文件中无序列信息,请检查文件后重新上传")
    except LabDatabaseException as exc:
        raise exc
    except Exception as exc:
        raise exc
