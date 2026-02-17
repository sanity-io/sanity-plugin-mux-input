const mimeExtGraph: Array<[string, string]> = [
    /* Audio */
    ['audio/x-aiff', 'aif'],
    ['audio/x-aiff', 'aiff'],
    ['audio/basic', 'au'],
    ['audio/basic', 'snd'],
    ['audio/x-mpegurl', 'm3u'],
    ['audio/midi', 'midi'],
    ['audio/midi', 'mid'],
    ['audio/m4a', 'mp3'],
    ['audio/mpeg', 'mp3'],
    ['audio/x-pn-realaudio', 'ra'],
    ['audio/x-pn-realaudio', 'ram'],
    ['audio/x-wav', 'wav'],
    ['audio/x-ms-wma', 'wma'],

    /* Video */
    ['video/3gpp', '3gp'],
    ['video/x-ms-wmv', 'wmv'],
    ['video/x-ms-wmx', 'wmx'],
    ['video/mp4', 'mp4'],
    ['video/mp4', 'm4v'],
    ['video/mp4', 'mp4v'],
    ['video/mpeg', 'mpeg'],
    ['video/mpeg', 'mpg'],
    ['video/quicktime', 'mov'],
    ['video/quicktime', 'qt'],
    ['video/x-mng', 'mng'],
    ['video/x-msvideo', 'avi'],
    ['video/x-flv', 'flv'],
    ['video/x-ms-asf', 'asf'],
    ['video/x-ms-asf', 'asx'],

    /* Subtitles */
    ['application/x-subrip', 'srt'],
    ['text/vtt', 'vtt'],
    ['text/x-ssa', 'ssa'],
    ['text/x-ass', 'ass'],
    ['application/x-sami', 'sami'],
    ['application/x-sami', 'smi'],
    ['text/x-microdvd', 'sub'],
    ['text/x-microdvd', 'vobsub'],
    ['text/x-mpl2', 'mpl2'],
]

export function mimeToExt(mime: string): string | undefined {
    const formattedMime = mime.trim().toLowerCase()
    for (const [_mime, _ext] of mimeExtGraph) {
        if (_mime === formattedMime) {
            return _ext
        }
    }
}

export function extToMime(ext: string): string | undefined {
    const formattedExt = ext.trim().toLowerCase()
    for (const [_mime, _ext] of mimeExtGraph) {
        if (_ext === formattedExt) {
            return _mime
        }
    }
}