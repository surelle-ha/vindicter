import { BetaService } from './beta.service';
export declare class BetaController {
    private service;
    constructor(service: BetaService);
    create(body: any): Promise<import("./entities/special-beta-application.entity").SpecialBetaApplication>;
    findAll(): Promise<import("./entities/special-beta-application.entity").SpecialBetaApplication[]>;
    updateStatus(id: string, status: any): Promise<import("./entities/special-beta-application.entity").SpecialBetaApplication>;
    remove(id: string): Promise<void>;
}
