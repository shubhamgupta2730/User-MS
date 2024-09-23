"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBundles = void 0;
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const getAllBundles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const search = req.query.search || '';
        const searchFilter = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const sortOptions = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };
        // Fetch bundles with pagination, sorting, and filtering
        const bundles = yield bundleProductModel_1.default.find(searchFilter)
            .select('name description MRP sellingPrice discount adminDiscount')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);
        const totalBundles = yield bundleProductModel_1.default.countDocuments(searchFilter);
        // Prepare the response with only bundle details
        const response = bundles.map((bundle) => ({
            _id: bundle._id,
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            adminDiscount: bundle.adminDiscount,
        }));
        res.status(200).json({
            message: 'Bundles fetched successfully',
            bundles: response,
            totalBundles,
            currentPage: page,
            totalPages: Math.ceil(totalBundles / limit),
        });
    }
    catch (error) {
        console.error('Failed to fetch bundles:', error);
        res.status(500).json({ message: 'Failed to fetch bundles', error });
    }
});
exports.getAllBundles = getAllBundles;
