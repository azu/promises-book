// LICENSE : MIT
"use strict";

import parse from "./parse";

export class AsciidoctorProcessor {
  constructor(config) {
    this.config = config;
  }

  static availableExtensions() {
    return [".adoc", ".asciidoctor", ".asc"];
  }

  processor(ext) {
    return {
      preProcess(text, filePath) {
        return parse(text);
      },
      postProcess(messages, filePath) {
        return {
          messages,
          filePath: filePath ? filePath : "<asciidoc>"
        };
      }
    };
  }
}
