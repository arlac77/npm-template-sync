/* jslint node: true, esnext: true */

'use strict';



export default class File {
  constructor(context, path) {

    Object.defineProperty(this, 'context', {
      value: context
    });

    Object.defineProperty(this, 'path', {
      value: path
    });

    context.addFile(this);
  }

  templateContent(options) {
    return this.getContent(this.context.templateRepo, this.path, options);
  }

  originalContent(options) {
    return this.getContent(this.context.targetRepo, this.path, options);
  }

  get mergedContent() {
    return this.originalContent;
  }

  getContent(repo, path, options = {}) {
    return new Promise((fullfill, reject) =>
      this.context.client.repo(repo).contents(path, (err, status, body, headers) => {
        if (err) {
          if (options.ignoreMissing) {
            fullfill('');
          } else {
            reject(err);
          }
        } else {
          const b = new Buffer(status.content, 'base64');
          fullfill(b.toString());
        }
      })
    );
  }

}
