<template>
    <div>
        <div class="modal-box add-species">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Species</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="form1">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Full name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Species name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Genus name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Variant name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-promoter-generator">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Promoter Generator<br></div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="form1">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Predictor model for calibrating the promoter strength</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-reporter">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Reporter<br></div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="form1">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Cannonical Protein Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-activator">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Activator</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="example-files">
                        <div class="download-label">Download example files</div>
                        <div class="download-links">
                            <a  class="download-link">Promoter sequence file</a>
                            <a  class="download-link">Background sequence file</a>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Cannonical Protein Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group form-file-upload">
                            <div class="form-label-top">
                                <div class="form-label-text">Promoter sequence file</div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">dataset 1.csv</div>
                                    <div class="form-file__file-ext">604KB</div>
                                </div>
                                <div class="form-file-box__right"><svg data-svg-ext-root="1"
                                        width="20"
                                        height="20" viewbox="0 0 8 9" fill="none" class="form-file-box__remove-btn">
                                        <path
                                            d="M6.6416 2.79004C6.7245 2.79013 6.7999 2.82658 6.85938 2.8877C6.91482 2.95303 6.94257 3.03441 6.93457 3.12012C6.93457 3.14845 6.71277 5.95758 6.58594 7.13965C6.50637 7.86479 6.03822 8.3053 5.33691 8.31738C4.7978 8.32946 4.27082 8.33301 3.75195 8.33301C3.20095 8.33301 2.66172 8.32946 2.13867 8.31738C1.46087 8.30114 0.992521 7.8527 0.916992 7.13965C0.786508 5.95341 0.568505 3.14845 0.564453 3.12012C0.560491 3.03441 0.587708 2.95302 0.643555 2.8877C0.698666 2.82645 0.778827 2.79004 0.862305 2.79004H6.6416ZM4.61035 0C4.97869 2.23471e-05 5.3081 0.257376 5.40332 0.624023L5.4707 0.927734C5.52581 1.17565 5.74109 1.35156 5.98828 1.35156H7.20312C7.36515 1.35165 7.5 1.48603 7.5 1.65723V1.81543C7.49998 1.98244 7.36514 2.121 7.20312 2.12109H0.297852C0.135364 2.12109 1.67958e-05 1.9825 0 1.81543V1.65723C0 1.48598 0.135354 1.35156 0.297852 1.35156H1.5127C1.75919 1.35138 1.97367 1.17588 2.0293 0.928711L2.09277 0.644531C2.19165 0.257468 2.51726 2.20217e-05 2.88965 0H4.61035Z"
                                            fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                            ></path>
                                    </svg></div>
                            </div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group form-file-upload">
                            <div class="form-label-top">
                                <div class="form-label-text">Background sequence file</div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">File Name</div>
                                    <div class="form-file__file-ext">File Size</div>
                                </div>
                                <div class="form-file-box__right">
                                    <a  class="btn form-file__upload-btn ">Upload File</a>
                                </div>
                            </div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Protein name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Consensus sequence</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Consensus position</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Global sequence shift</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-protein-expression-dataset">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Protein Expression Dataset</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="example-files">
                        <div class="download-label">Download a template to fill in the experimental data:</div>
                        <div class="download-links">
                            <a  class="download-link">Constitutive expression (no regulator)</a>
                            <a  class="download-link">Expression regulated by a single regulator</a>
                            <a  class="download-link">Expression regulated tandemly by 2 regulators</a>
                            <a  class="download-link">Expression regulated simutaneously by 2 regulators...</a>
                            <a  class="download-link">1 upstream regulator</a>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Reporter</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Unit</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group form-file-upload">
                            <div class="form-label-top">
                                <div class="form-label-text">Upload dataset file(s)</div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">dataset 1.csv</div>
                                    <div class="form-file__file-ext">604KB</div>
                                </div>
                                <div class="form-file-box__right"><svg data-svg-ext-root="1"
                                        width="20"
                                        height="20" viewbox="0 0 8 9" fill="none" class="form-file-box__remove-btn">
                                        <path
                                            d="M6.6416 2.79004C6.7245 2.79013 6.7999 2.82658 6.85938 2.8877C6.91482 2.95303 6.94257 3.03441 6.93457 3.12012C6.93457 3.14845 6.71277 5.95758 6.58594 7.13965C6.50637 7.86479 6.03822 8.3053 5.33691 8.31738C4.7978 8.32946 4.27082 8.33301 3.75195 8.33301C3.20095 8.33301 2.66172 8.32946 2.13867 8.31738C1.46087 8.30114 0.992521 7.8527 0.916992 7.13965C0.786508 5.95341 0.568505 3.14845 0.564453 3.12012C0.560491 3.03441 0.587708 2.95302 0.643555 2.8877C0.698666 2.82645 0.778827 2.79004 0.862305 2.79004H6.6416ZM4.61035 0C4.97869 2.23471e-05 5.3081 0.257376 5.40332 0.624023L5.4707 0.927734C5.52581 1.17565 5.74109 1.35156 5.98828 1.35156H7.20312C7.36515 1.35165 7.5 1.48603 7.5 1.65723V1.81543C7.49998 1.98244 7.36514 2.121 7.20312 2.12109H0.297852C0.135364 2.12109 1.67958e-05 1.9825 0 1.81543V1.65723C0 1.48598 0.135354 1.35156 0.297852 1.35156H1.5127C1.75919 1.35138 1.97367 1.17588 2.0293 0.928711L2.09277 0.644531C2.19165 0.257468 2.51726 2.20217e-05 2.88965 0H4.61035Z"
                                            fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                            ></path>
                                    </svg></div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">Select a file (*.CSV)</div>
                                    <div class="form-file__file-ext">1024 MB Limit</div>
                                </div>
                                <div class="form-file-box__right">
                                    <a  class="btn form-file__upload-btn ">Upload File</a>
                                </div>
                            </div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of expression strength</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of record ID</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column names of experimental conditions (one per line) 
                                </div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of promoter sequence</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of gene</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of transcription start site (TSS)</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-gene-dataset">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Gene Dataset</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="example-files">
                        <div class="download-label">Download a template to fill in the experimental data</div>
                        <div class="download-links">
                            <a  class="download-link">Promoter sequences</a>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group form-file-upload">
                            <div class="form-label-top">
                                <div class="form-label-text">Upload dataset file(s)</div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">dataset 1.csv</div>
                                    <div class="form-file__file-ext">604KB</div>
                                </div>
                                <div class="form-file-box__right"><svg data-svg-ext-root="1"
                                        width="20"
                                        height="20" viewbox="0 0 8 9" fill="none" class="form-file-box__remove-btn">
                                        <path
                                            d="M6.6416 2.79004C6.7245 2.79013 6.7999 2.82658 6.85938 2.8877C6.91482 2.95303 6.94257 3.03441 6.93457 3.12012C6.93457 3.14845 6.71277 5.95758 6.58594 7.13965C6.50637 7.86479 6.03822 8.3053 5.33691 8.31738C4.7978 8.32946 4.27082 8.33301 3.75195 8.33301C3.20095 8.33301 2.66172 8.32946 2.13867 8.31738C1.46087 8.30114 0.992521 7.8527 0.916992 7.13965C0.786508 5.95341 0.568505 3.14845 0.564453 3.12012C0.560491 3.03441 0.587708 2.95302 0.643555 2.8877C0.698666 2.82645 0.778827 2.79004 0.862305 2.79004H6.6416ZM4.61035 0C4.97869 2.23471e-05 5.3081 0.257376 5.40332 0.624023L5.4707 0.927734C5.52581 1.17565 5.74109 1.35156 5.98828 1.35156H7.20312C7.36515 1.35165 7.5 1.48603 7.5 1.65723V1.81543C7.49998 1.98244 7.36514 2.121 7.20312 2.12109H0.297852C0.135364 2.12109 1.67958e-05 1.9825 0 1.81543V1.65723C0 1.48598 0.135354 1.35156 0.297852 1.35156H1.5127C1.75919 1.35138 1.97367 1.17588 2.0293 0.928711L2.09277 0.644531C2.19165 0.257468 2.51726 2.20217e-05 2.88965 0H4.61035Z"
                                            fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                            ></path>
                                    </svg></div>
                            </div>
                            <div class="form-file-box">
                                <div class="form-file-box__left">
                                    <div class="form-file__file-name">Select a file (*.CSV)</div>
                                    <div class="form-file__file-ext">1024 MB Limit</div>
                                </div>
                                <div class="form-file-box__right">
                                    <a  class="btn form-file__upload-btn ">Upload File</a>
                                </div>
                            </div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of record ID</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of gene</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of gene sequence</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Column name of transcription start site (TSS)</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-training-a-promoter-strength-predictor">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Training a Promoter Strength Predictor</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Training mode</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Dataset for Training </div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Transcriptional Activator for Motif Finding</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Minimum promoter shift</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Maximum promoter shift</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Minimum spacer length variation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Maximum spacer length variation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-body second">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="checkbox-label">Cross-validate on the split datasets</div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Seed for the random number generator</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"><svg data-svg-ext-root="1"
                                    width="18"
                                    height="18" viewbox="0 0 18 18" fill="none" class="form-input__right-icon">
                                    <path
                                        d="M8.75 0C3.91797 0 0 3.91797 0 8.75C0 13.582 3.91797 17.5 8.75 17.5C13.582 17.5 17.5 13.582 17.5 8.75C17.5 3.91797 13.582 0 8.75 0ZM8.75 13.8281C8.31836 13.8281 7.96875 13.4785 7.96875 13.0469C7.96875 12.6152 8.31836 12.2656 8.75 12.2656C9.18164 12.2656 9.53125 12.6152 9.53125 13.0469C9.53125 13.4785 9.18164 13.8281 8.75 13.8281ZM9.97852 9.54102C9.61719 9.67969 9.375 10.0312 9.375 10.416V10.8594C9.375 10.9453 9.30469 11.0156 9.21875 11.0156H8.28125C8.19531 11.0156 8.125 10.9453 8.125 10.8594V10.4395C8.125 9.98828 8.25586 9.54297 8.51367 9.17188C8.76562 8.80859 9.11719 8.53125 9.53125 8.37305C10.1953 8.11719 10.625 7.56055 10.625 6.95312C10.625 6.0918 9.7832 5.39062 8.75 5.39062C7.7168 5.39062 6.875 6.0918 6.875 6.95312V7.10156C6.875 7.1875 6.80469 7.25781 6.71875 7.25781H5.78125C5.69531 7.25781 5.625 7.1875 5.625 7.10156V6.95312C5.625 6.18555 5.96094 5.46875 6.57031 4.93555C7.15625 4.42188 7.92969 4.14062 8.75 4.14062C9.57031 4.14062 10.3438 4.42383 10.9297 4.93555C11.5391 5.46875 11.875 6.18555 11.875 6.95312C11.875 8.08203 11.1309 9.09766 9.97852 9.54102Z"
                                        fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                        ></path>
                                </svg></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box add-transcriptional-regulators">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Add Transcriptional Regulators</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-steps">
                    <div class="modal-step active"></div>
                    <div class="modal-step"></div>
                </div>
                <div class="modal-body auto-width">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Name</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Regulation Type</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Registration Method</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Datasets For Characterizing The Regulation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">The Type Of Transcription Factor (TF)</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Customize the sequence of TF binding sites</div>
                            </div>
                            <div class="form-input-box"><textarea resize="none"
                                    class="form-input multiple-line"></textarea></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Condition variable of TF concentration</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Condition variable of TF induction</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Scaling Factor</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Also use datasets to calibrate the TF concentration</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-body second">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="checkbox-label">Adjust the maximum output</div>
                        </div>
                        <div class="form-group">
                            <div class="checkbox-label">Adjust the minimum output</div>
                        </div>
                        <div class="form-group">
                            <div class="checkbox-label">Adjust the binding cooperativity</div>
                        </div>
                        <div class="form-group">
                            <div class="checkbox-label">Extend the model for transcription initiation (+1 parameter)
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="checkbox-label">Cross-validate on the split datasets</div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Seed for the random number generator</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"><svg data-svg-ext-root="1"
                                    width="18"
                                    height="18" viewbox="0 0 18 18" fill="none" class="form-input__right-icon">
                                    <path
                                        d="M8.75 0C3.91797 0 0 3.91797 0 8.75C0 13.582 3.91797 17.5 8.75 17.5C13.582 17.5 17.5 13.582 17.5 8.75C17.5 3.91797 13.582 0 8.75 0ZM8.75 13.8281C8.31836 13.8281 7.96875 13.4785 7.96875 13.0469C7.96875 12.6152 8.31836 12.2656 8.75 12.2656C9.18164 12.2656 9.53125 12.6152 9.53125 13.0469C9.53125 13.4785 9.18164 13.8281 8.75 13.8281ZM9.97852 9.54102C9.61719 9.67969 9.375 10.0312 9.375 10.416V10.8594C9.375 10.9453 9.30469 11.0156 9.21875 11.0156H8.28125C8.19531 11.0156 8.125 10.9453 8.125 10.8594V10.4395C8.125 9.98828 8.25586 9.54297 8.51367 9.17188C8.76562 8.80859 9.11719 8.53125 9.53125 8.37305C10.1953 8.11719 10.625 7.56055 10.625 6.95312C10.625 6.0918 9.7832 5.39062 8.75 5.39062C7.7168 5.39062 6.875 6.0918 6.875 6.95312V7.10156C6.875 7.1875 6.80469 7.25781 6.71875 7.25781H5.78125C5.69531 7.25781 5.625 7.1875 5.625 7.10156V6.95312C5.625 6.18555 5.96094 5.46875 6.57031 4.93555C7.15625 4.42188 7.92969 4.14062 8.75 4.14062C9.57031 4.14062 10.3438 4.42383 10.9297 4.93555C11.5391 5.46875 11.875 6.18555 11.875 6.95312C11.875 8.08203 11.1309 9.09766 9.97852 9.54102Z"
                                        fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                        ></path>
                                </svg></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Save</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box predicting-promoter-strengths">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Predicting promoter strengths</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout align-center">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Model For Prediction</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Please input sequences line-by-line</div>
                                <a  class="form-label-link">Add an Example</a>
                            </div>
                            <div class="form-input-box"><textarea resize="none"
                                    class="form-input multiple-line"></textarea></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="result-box"><img src="/images/pps-result.png" loading="lazy" sizes="100vw"
                            srcset="/images/pps-result-p-500.png 500w, /images/pps-result-p-800.png 800w, /images/pps-result.png 812w"
                            alt="" class="result-img"></div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Predict</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box generating-promoter-sequences">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Generating promoter sequences</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout align-center">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Model For Generation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Please input the desired pattern</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Please input the desired strength(s) line-by-line</div>
                            </div>
                            <div class="form-input-box"><textarea resize="none"
                                    class="form-input multiple-line"></textarea></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Relative tolerance of strength deviation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Seed for the random number generator</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"><svg data-svg-ext-root="1"
                                    width="18"
                                    height="18" viewbox="0 0 18 18" fill="none" class="form-input__right-icon">
                                    <path
                                        d="M8.75 0C3.91797 0 0 3.91797 0 8.75C0 13.582 3.91797 17.5 8.75 17.5C13.582 17.5 17.5 13.582 17.5 8.75C17.5 3.91797 13.582 0 8.75 0ZM8.75 13.8281C8.31836 13.8281 7.96875 13.4785 7.96875 13.0469C7.96875 12.6152 8.31836 12.2656 8.75 12.2656C9.18164 12.2656 9.53125 12.6152 9.53125 13.0469C9.53125 13.4785 9.18164 13.8281 8.75 13.8281ZM9.97852 9.54102C9.61719 9.67969 9.375 10.0312 9.375 10.416V10.8594C9.375 10.9453 9.30469 11.0156 9.21875 11.0156H8.28125C8.19531 11.0156 8.125 10.9453 8.125 10.8594V10.4395C8.125 9.98828 8.25586 9.54297 8.51367 9.17188C8.76562 8.80859 9.11719 8.53125 9.53125 8.37305C10.1953 8.11719 10.625 7.56055 10.625 6.95312C10.625 6.0918 9.7832 5.39062 8.75 5.39062C7.7168 5.39062 6.875 6.0918 6.875 6.95312V7.10156C6.875 7.1875 6.80469 7.25781 6.71875 7.25781H5.78125C5.69531 7.25781 5.625 7.1875 5.625 7.10156V6.95312C5.625 6.18555 5.96094 5.46875 6.57031 4.93555C7.15625 4.42188 7.92969 4.14062 8.75 4.14062C9.57031 4.14062 10.3438 4.42383 10.9297 4.93555C11.5391 5.46875 11.875 6.18555 11.875 6.95312C11.875 8.08203 11.1309 9.09766 9.97852 9.54102Z"
                                        fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                        ></path>
                                </svg></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="result-box"><img src="/images/gps-result.png" loading="lazy" sizes="100vw"
                            srcset="/images/gps-result-p-500.png 500w, /images/gps-result-p-800.png 800w, /images/gps-result.png 810w"
                            alt="" class="result-img"></div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Generate</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box generating-promoter-libraries">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Generating promoter libraries</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Transciprtional Activator For Generation</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Desired number of sequences for each submotif</div>
                            </div>
                            <div class="form-two-column">
                                <div class="form-column">
                                    <div class="form-column-inner">
                                        <div class="form-label-left">
                                            <div class="form-label-left__text">-35 region</div>
                                        </div>
                                        <div class="form-input-box inline"><input class="form-input"></div>
                                    </div>
                                    <div class="form-err">
                                        <div class="form-err-text"></div>
                                    </div>
                                </div>
                                <div class="form-column">
                                    <div class="form-column-inner">
                                        <div class="form-label-left">
                                            <div class="form-label-left__text">-15 region</div>
                                        </div>
                                        <div class="form-input-box inline"><input class="form-input"></div>
                                    </div>
                                    <div class="form-err">
                                        <div class="form-err-text"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Desired pattern for each submotif</div>
                            </div>
                            <div class="form-two-column">
                                <div class="form-column">
                                    <div class="form-column-inner">
                                        <div class="form-label-left">
                                            <div class="form-label-left__text">-35 region</div>
                                        </div>
                                        <div class="form-input-box inline"><input class="form-input"></div>
                                    </div>
                                    <div class="form-err">
                                        <div class="form-err-text"></div>
                                    </div>
                                </div>
                                <div class="form-column">
                                    <div class="form-column-inner">
                                        <div class="form-label-left">
                                            <div class="form-label-left__text">-15 region</div>
                                        </div>
                                        <div class="form-input-box inline"><input class="form-input"></div>
                                    </div>
                                    <div class="form-err">
                                        <div class="form-err-text"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Relative score range for each submotif</div>
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text">-35 region</div><input class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text form-label-text__15region">-15 region</div><input
                                    class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                        </div>
                    </div>
                    <div class="form1 activator-form">
                        <div class="result-box align-left"><img src="/images/gpl-result.png" loading="lazy" alt=""
                                class="result-img gpl"></div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Combinations of submotifs</div>
                            </div>
                            <div class="form-input-box"><textarea resize="none"
                                    class="form-input multiple-line"></textarea></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Generate</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box optimizing-transcriptional-regulation">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Optimizing transcriptional regulation</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout align-center">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Please select a regulator to optimize</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Select the optimization target</div>
                                <div class="form-label-top__right">
                                    <div class="text">X</div>
                                    <div class="text">+</div>
                                </div>
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text">Subtarget 1</div><input class="form-input">
                            </div>
                            <div class="form-input-box with-label second-line">
                                <div class="form-label-text form-label-text__hidden">Subtarget 1</div>
                                <div class="form-label-text">Weight 1</div><input
                                    class="form-input form-input__limit-width">
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text">Subtarget 2</div><input class="form-input">
                            </div>
                            <div class="form-input-box with-label second-line">
                                <div class="form-label-text form-label-text__hidden">Subtarget 2<br></div>
                                <div class="form-label-text">Weight 2</div><input
                                    class="form-input form-input__limit-width">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Predictor for estimating the promoter strength</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-section-title">
                            <div class="form-section-title__text">Plot options</div>
                        </div>
                        <div class="form-group">
                            <div class="checkbox-label">Cross-validate on the split datasets</div>
                        </div>
                        <div class="form-section-title">
                            <div class="form-section-title__text">Constraints for optimization</div><svg
                                
                                width="15" height="7" viewbox="0 0 9 5" fill="none" class="form-section-title__icon">
                                <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="black" stroke-linecap="round"
                                    stroke-linejoin="round"  
                                    fill="currentColor" ></path>
                            </svg>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Desired range of the optimization target</div>
                            </div>
                            <div class="form-input-box__multiple">
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum uninduced expression</div><input
                                        class="form-input">
                                </div>
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum induced expression</div><input
                                        class="form-input">
                                </div>
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum induction fold-change</div><input
                                        class="form-input">
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Concentration range of the TF</div>
                            </div>
                            <div class="form-input-box with-label"><input class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Concentration range of the inducer (mol/L)</div>
                            </div>
                            <div class="form-input-box with-label"><input class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Datasets containing possible choice of promoters</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="result-box align-left"><img src="/images/otr-result.png" loading="lazy" sizes="100vw"
                            srcset="/images/otr-result-p-500.png 500w, /images/otr-result-p-800.png 800w, /images/otr-result-p-1080.png 1080w, /images/otr-result.png 1152w"
                            alt="" class="result-img"></div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Optimize</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-box designing-a-promoter-sequence">
            <div class="overlay"></div>
            <div class="modal-inner">
                <div class="modal-header">
                    <div class="model-header__left">
                        <div class="modal-title">Designing a promoter sequence</div>
                    </div>
                    <div class="modal-header__right">
                        <div class="modal-close-btn"><svg data-svg-ext-mode="persistent"
                                width="10" height="10" viewbox="0 0 10 10"
                                fill="none" class="modal-close-icon">
                                <path opacity="0.8"
                                    d="M5.91615 4.99993L9.80995 8.89392C10.0634 9.14721 10.0634 9.55675 9.80995 9.81003C9.55667 10.0633 9.14714 10.0633 8.89386 9.81003L4.99994 5.91604L1.10614 9.81003C0.85274 10.0633 0.443335 10.0633 0.190051 9.81003C-0.0633505 9.55675 -0.0633505 9.14721 0.190051 8.89392L4.08385 4.99993L0.190051 1.10593C-0.0633505 0.852639 -0.0633505 0.443107 0.190051 0.189818C0.316278 0.0634708 0.482246 0 0.648097 0C0.813947 0 0.979797 0.0634708 1.10614 0.189818L4.99994 4.08382L8.89386 0.189818C9.0202 0.0634708 9.18605 0 9.3519 0C9.51775 0 9.6836 0.0634708 9.80995 0.189818C10.0634 0.443107 10.0634 0.852639 9.80995 1.10593L5.91615 4.99993Z"
                                    fill="currentColor"  data-svg-ext-orig-fill="#E71D36"
                                    ></path>
                            </svg></div>
                    </div>
                </div>
                <div class="modal-body auto-width column-layout align-center">
                    <div class="form1 activator-form">
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">I&#x27;d like to start from...</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Please select an existing regulator</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Sequence of the TF binding site (optional)</div>
                            </div>
                            <div class="form-input-box"><textarea resize="none"
                                    class="form-input multiple-line"></textarea></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Select the optimization target</div>
                                <div class="form-label-top__right">
                                    <div class="text">X</div>
                                    <div class="text">+</div>
                                </div>
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text">Subtarget 1</div><input class="form-input">
                            </div>
                            <div class="form-input-box with-label second-line">
                                <div class="form-label-text form-label-text__hidden">Subtarget 1</div>
                                <div class="form-label-text">Weight 1</div><input
                                    class="form-input form-input__limit-width">
                            </div>
                            <div class="form-input-box with-label">
                                <div class="form-label-text">Subtarget 2</div><input class="form-input">
                            </div>
                            <div class="form-input-box with-label second-line">
                                <div class="form-label-text form-label-text__hidden">Subtarget 2<br></div>
                                <div class="form-label-text">Weight 2</div><input
                                    class="form-input form-input__limit-width">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Predictor for estimating the promoter strength</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                        <div class="form-section-title">
                            <div class="form-section-title__text">Constraints for optimization</div><svg
                                
                                width="15" height="7" viewbox="0 0 9 5" fill="none" class="form-section-title__icon">
                                <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="black" stroke-linecap="round"
                                    stroke-linejoin="round"  
                                    fill="currentColor" ></path>
                            </svg>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Desired range of the optimization target</div>
                            </div>
                            <div class="form-input-box__multiple">
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum uninduced expression</div><input
                                        class="form-input">
                                </div>
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum induced expression</div><input
                                        class="form-input">
                                </div>
                                <div class="form-input-box with-label inline">
                                    <div class="form-label-text">Minimum induction fold-change</div><input
                                        class="form-input">
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Concentration range of the TF</div>
                            </div>
                            <div class="form-input-box with-label"><input class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Concentration range of the inducer (mol/L)</div>
                            </div>
                            <div class="form-input-box with-label"><input class="form-input">
                                <div class="form-input-box__separator">~</div><input class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-label-top">
                                <div class="form-label-text">Datasets containing possible choice of promoters</div>
                            </div>
                            <div class="form-input-box"><input class="form-input"></div>
                            <div class="form-err">
                                <div class="form-err-text"></div>
                            </div>
                        </div>
                    </div>
                    <div class="result-box align-left"><img src="/images/otr-result.png" loading="lazy" sizes="100vw"
                            srcset="/images/otr-result-p-500.png 500w, /images/otr-result-p-800.png 800w, /images/otr-result-p-1080.png 1080w, /images/otr-result.png 1152w"
                            alt="" class="result-img"></div>
                </div>
                <div class="modal-footer">
                    <div class="form-buttons">
                        <a  class="btn btn-danger ">Reset</a>
                        <a  class="btn btn-primary ">Optimize</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
    },
    components: {
    },
    created() {
        let t = this;
        if (t.editItem) {
            t.item = mirror(t.editItem);
            copyFrom(t.f, t.item);
        }
        else {
            debug(() => {
            });
        }
    },
    mounted() {

    },
    methods: {
        async save() {
            let t = this;

            if (t.busying)
                return;

            if (!t.f.name) {
                A.err('请输入组织名称');
                return;
            }

            if (!t.f.code) {
                A.err('请输入组织代码');
                return;
            }

            if (!t.item) {
                if (!t.f.username) {
                    A.err('请输入管理员账号');
                    return;
                }
            }

            if (t.showPasswordInput) {
                if (!t.f.password) {
                    A.err('请输入管理员密码');
                    return;
                }
            }


            t.busying = true;

            if (t.f.logo_blob) {
                const formData = new FormData();
                formData.append('image', t.f.logo_blob);
                await axios.post('org/saveImage', formData).then(res => {
                    if (res.data.status == 1) {
                        t.f.logo_url = res.data.options.img_url;
                        delete t.f.logo_blob;
                    }
                });
            }


            if (!t.item) {
                axios.post('org', t.f).then(res => {
                    t.busying = false;
                    if (res.data.status == 1) {
                        t.item = mirror(res.data.options.item);
                        t.$emit('create', t.item);
                        A.toast('保存成功！');
                        t.$emit('close');
                    }
                    else if (res.data.status == 2) {
                        A.err('组织名称已存在');
                    }
                    else if (res.data.status == 3) {
                        A.err('组织代码已存在');
                    }
                    else if (res.data.status == 4) {
                        A.err('管理员账号已存在');
                    }
                });
            }
            else {
                axios.put('org/' + t.item.id, t.f).then(res => {
                    t.busying = false;
                    if (res.data.status == 1) {
                        mirror(t.f, t.item);
                        t.$emit('save', t.item);
                        A.toast('保存成功！');
                        t.$emit('close');
                    }
                    else if (res.data.status == 2) {
                        A.err('组织名称已存在');
                    }
                    else if (res.data.status == 3) {
                        A.err('组织代码已存在');
                    }
                    else if (res.data.status == 4) {
                        A.err('管理员账号已存在');
                    }
                });
            }

        },
        close() {
            let t = this;
            A.safety('编辑还没保存，确定要取消操作吗？').then(res => {
                if (res.isConfirmed) {
                    t.$emit('close');
                }
            });
        }
    },
    data() {
        return {
            showPasswordInput: false,
            item: null,
            f: {
            },
            list: {
            },
        };
    }
};
</script>

<style lang="scss" scoped></style>