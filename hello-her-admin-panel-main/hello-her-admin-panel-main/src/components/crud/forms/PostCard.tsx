"use client";

import Image from "next/image";
import { MdLocationOn } from "react-icons/md";
import { FaHeart, FaShareAlt, FaCommentDots } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface PostCardProps {
    post: any;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    return (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 max-w-lg w-full mx-auto mb-6">
            {/* Community Banner */}
            {post.community?.bannerImage && (
                <div className="h-48 bg-black w-full relative">
                    <Image
                        fill
                        alt="Community Banner"
                        className="object-contain"
                        src={post.community.bannerImage}
                    />
                </div>
            )}

            {/* Post Content */}
            <div className="p-5">
                {/* Community Info */}
                <div className="flex items-center mb-4">
                    {post?.community?.profileImage && <Image
                        src={post.community.profileImage}
                        alt="Community"
                        width={50}
                        height={50}
                        className="rounded-full border mr-3"
                    />
                    }
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">{post.community.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                            <MdLocationOn className="mr-1" />
                            {post.community.location.city}, {post.community.location.state}
                        </p>
                    </div>
                </div>

                {/* Title & Content */}
                <h2 className="text-xl font-bold text-primary mb-2">{post.title}</h2>
                <p className="text-gray-700 mb-4">{post.content}</p>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag: string) => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Swiper Attachment Slider */}
                {post.attachments?.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden border">
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            navigation
                            loop={true}
                            pagination={{ clickable: true }}
                            modules={[Navigation, Pagination]}
                            className="w-full h-72"
                        >
                            {post.attachments.map((attachment: any) => (
                                <SwiperSlide key={attachment.url}>
                                    <Image
                                        fill
                                        alt="Attachment"
                                        src={attachment.url}
                                        className="object-contain"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
                    <div className="flex items-center gap-1">
                        <FaHeart className="text-red-500" /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1">
                        <FaCommentDots className="text-blue-500" /> {post.commentsCount}
                    </div>
                    <div className="flex items-center gap-1">
                        <FaShareAlt className="text-green-500" /> {post.shares}
                    </div>
                    <div className="ml-auto text-xs text-gray-400">
                        Posted on {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
