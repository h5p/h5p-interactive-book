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
                const random = Math.random() * 16 | 0, newChar = char === 'x' ? random : (random & 0x3 | 0x8);
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
            bookCover.coverMedia = convertToImageParams(bookCover.coverImage, bookCover.coverAltText);
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
      }
    }
  };
})();
