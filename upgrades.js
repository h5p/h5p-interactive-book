var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.InteractiveBook'] = (function () {
  return {
    1: {
      /**
       * Upgrade cover description to not imply "centered"
       * @param {object} parameters Parameters of content.
       * @param {function} finished Callback.
       * @param {object} extras Metadata.
       */
      6: function (parameters, finished, extras) {
        if (parameters && parameters.bookCover) {
          const bookCover = parameters.bookCover;

          const convertToImageParams = function (file, alt) {
            const imageParams = {
              library: 'H5P.Image 1.1',
              metadata: {
                contentType: 'Image',
                license: 'U',
                title: 'Untitled Image'
              },
              params: {
                contentName: 'Image',
                decorative: false
              },
              subContentId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
                const random = Math.random()*16|0, newChar = char === 'x' ? random : (random&0x3|0x8);
                return newChar.toString(16);
              })
            };

            if (alt) {
              imageParams.params.alt = alt;
            }

            if (file) {
              imageParams.params.file = file;
              if (file.copyright) {
                const copyright = file.copyright;

                if (copyright.author) {
                  imageParams.metadata.authors = [{
                    name: copyright.author,
                    role: 'Author'
                  }];
                }

                if (copyright.license) {
                  imageParams.metadata.license = copyright.license;
                }

                if (copyright.source) {
                  imageParams.metadata.source = copyright.source;
                }

                if (copyright.title) {
                  imageParams.metadata.title = copyright.title;
                }

                if (copyright.version) {
                  imageParams.metadata.licenseVersion = copyright.version;
                }

                if (copyright.year && !isNaN(parseInt(copyright.year))) {
                  imageParams.metadata.yearFrom = parseInt(copyright.year);
                }

                delete imageParams.params.file.copyright;
              }
            }

            return imageParams;
          };

          if (bookCover.coverAltText || bookCover.coverImage) {
            bookCover.coverMedium = convertToImageParams(bookCover.coverImage, bookCover.coverAltText);
          }

          delete bookCover.coverImage;
          delete bookCover.coverAltText;
        }
        
        if (parameters && parameters.bookCover && parameters.bookCover.coverDescription) {
          if (parameters.bookCover.coverDescription.substr(0, 2) !== '<p') {
            parameters.bookCover.coverDescription = '<p style="text-align: center;">' + parameters.bookCover.coverDescription + '</p>'; // was plain text
          }
          else {
            parameters.bookCover.coverDescription = parameters.bookCover.coverDescription.replace(/<p[^>]*>/g, '<p style="text-align: center;">');
          }
        }

        finished(null, parameters, extras);
      },
      8: function (parameters, finished, extras) {
        const tables = parameters.bookCover.coverDescription.split('<table');
        let newParams = tables[0];

        for (let i = 1; i < tables.length; i++) {
          const style = tables[i].includes('h5p-table') ? 
            'style="border-style:solid;' :
            'style="border-style:double;border-width:0.2em;border-collapse:collapse;';

          if (tables[i].includes('border')) {
            // Set border style on the table
            if (tables.includes('style="')) {
              tables[i] = tables[i].replace('style="', style);
            }
            else {
              tables[i] = ' ' + style + '"' + tables[i];
            }

            // Set border style on header cells
            let headers = tables[i].split(/<th(?!ead)/);
            tables[i] = headers[0];

            for (let j = 1; j < headers.length; j++) {
              tables[i] += '<th';

              if (headers[j].includes('style="')) {
                tables[i] += headers[j].replace('style="', style);
              }
              else {
                tables[i] += ' ' + style + '"' + headers[j];
              }
            }
            
            // Set border style on cells
            let cells = tables[i].split('<td');
            tables[i] = cells[0];

            for (let j = 1; j < cells.length; j++) {
              tables[i] += '<td';

              if (cells[j].includes('style="')) {
                tables[i] += cells[j].replace('style="', style);
              }
              else {
                tables[i] += ' ' + style + '"' + cells[j];
              }
            }
          }

          newParams += '<table' + tables[i];
        }

        parameters.bookCover.coverDescription = newParams;
        finished(null, parameters, extras);
      }
    }
  };
})();
