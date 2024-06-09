chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (
        request.action === 'dump-prompt' &&
        (request.context || request.prompt || request.pdf)
    ) {
        // let file;
        // let dataTransfer;
        // if (request.pdf) {
        //     await new Promise((resolve) => {
        //         chrome.storage.local.get('downloadedFile', (data) => {
        //             const base64pdf = data.downloadedFile;
        //             const byteCharacters = atob(base64pdf);
        //             const byteNumbers = new Array(byteCharacters.length);
        //             for (let i = 0; i < byteCharacters.length; i++) {
        //                 byteNumbers[i] = byteCharacters.charCodeAt(i);
        //             }
        //             const byteArray = new Uint8Array(byteNumbers);
        //             file = new File([byteArray], 'downloaded_file.pdf', {
        //                 type: 'application/pdf',
        //             });

        //             dataTransfer = new DataTransfer();
        //             dataTransfer.items.add(file);
        //             dataTransfer.effectAllowed = 'all';
        //             resolve();
        //         });
        //     });
        // }
        const pdfUrl = request.pdf;
        console.log(pdfUrl);
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Step 2: Convert the response to a Blob
        const pdfBlob = await response.blob();
        console.log('Blob:', pdfBlob);

        // Step 3: Create a File object from the Blob
        const pdfFile = new File([pdfBlob], 'example.pdf', {
            type: 'application/pdf',
        });
        console.log('File:', pdfFile);

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(pdfFile);

        await new Promise((resolve) => setTimeout(() => resolve(), 370));

        const input = document.getElementById('prompt-textarea');
        if (input && (request.context || request.prompt)) {
            input.blur();
            input.value =
                (request.context ? request.context : '') +
                (request.context && request.prompt ? '\n\n' : '') +
                (request.prompt || '');
            input.focus();
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }

        // main.transition-width
        const dropZone = document.querySelector(
            'div.text-token-text-secondary span'
        );
        if (request.pdf && dropZone) {
            console.log(dropZone);
            dropZone.draggable = true;
            dropZone.type = 'file';
            dropZone.files = dataTransfer.files;

            // dropZone.addEventListener('dragstart', (ev) => {
            //     ev.dataTransfer.items.add(pdfFile);
            //     ev.dataTransfer.effectAllowed = 'all';
            // });

            // console.log(dropZone, dataTransfer);
            // dataTransfer.effectAllowed = 'all';
            // dataTransfer.dropEffect = 'copy';
            // const dragStartEvent = new DragEvent('dragstart', {
            //     dataTransfer,
            //     bubbles: true,
            // });
            // const dragEnterEvent = new DragEvent('dragenter', {
            //     dataTransfer,
            //     bubbles: true,
            // });
            // const dragOverEvent = new DragEvent('dragover', {
            //     dataTransfer,
            //     bubbles: true,
            // });
            // const dropEvent = new DragEvent('drop', {
            //     dataTransfer,
            //     bubbles: true,
            // });
            // dropZone.dispatchEvent(dragStartEvent);
            // await new Promise((resolve) => setTimeout(() => resolve(), 200));
            // dropZone.dispatchEvent(dragEnterEvent);
            // await new Promise((resolve) => setTimeout(() => resolve(), 200));
            // dropZone.dispatchEvent(dragOverEvent);
            // await new Promise((resolve) => setTimeout(() => resolve(), 200));
            // dropZone.dispatchEvent(dropEvent);
            // console.log('done');
        }
    }
});
