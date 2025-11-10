export class ImagePreloader {
    private static instance: ImagePreloader;
    private preloadedImages = new Set<string>();
    private preloadingPromises = new Map<string, Promise<void>>();

    static getInstance(): ImagePreloader {
        if (!ImagePreloader.instance) {
            ImagePreloader.instance = new ImagePreloader();
        }
        return ImagePreloader.instance;
    }

    async preloadImage(url: string): Promise<void> {
        if (this.preloadedImages.has(url)) {
            return Promise.resolve();
        }

        if (this.preloadingPromises.has(url)) {
            return this.preloadingPromises.get(url)!;
        }

        const promise = new Promise<void>((resolve, _) => {
            const img = new Image();
            
            img.onload = () => {
                this.preloadedImages.add(url);
                this.preloadingPromises.delete(url);
                resolve();
            };
            
            img.onerror = () => {
                this.preloadingPromises.delete(url);
                resolve();
            };
            
            img.src = url;
        });

        this.preloadingPromises.set(url, promise);
        return promise;
    }

    async preloadNextRoundImages(appIds: number[]): Promise<void> {
        const imageUrls = appIds.map(appId => 
            `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
        );

        await Promise.allSettled(imageUrls.map(url => this.preloadImage(url)));
    }

    isImagePreloaded(url: string): boolean {
        return this.preloadedImages.has(url);
    }

    getPreloadedCount(): number {
        return this.preloadedImages.size;
    }
}