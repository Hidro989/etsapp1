import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  customerId: { type: String, required: true },
  email: { type: String, required: true },
  customerName: { type: String },
  rating: { type: Number, required: true },
  message: { type: String },
  ratingStatus: { type: String, enum: ['pending', 'approved'], default: 'pending' },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

const loadReview = async (reviewId) => {
    const dbSession = await Review.findOne({ _id: reviewId });
    if (dbSession) {
      return new Review({
        _id: dbSession._id,
        productId: dbSession.productId,
        productTitle: dbSession.productTitle,
        customerId: dbSession.customerId,
        customerName: dbSession.customerName,
        rating: dbSession.rating,
        message: dbSession.message,
        ratingStatus: dbSession.ratingStatus,
      });
    }
    return null;
  };

export {loadReview};