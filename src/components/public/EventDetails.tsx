'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { Utensils, Wine, Shirt, Music, Users, Sparkles } from 'lucide-react';
import { VietnameseCloudDivider, VietnameseCornerFlourish, VietnameseLotusCrest } from './VietnameseMotifDividers';

interface Props {
  lang: Language;
}

export const EventDetails: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];

  const banquetCoursesEn = [
    { num: '01', title: 'Four Seasons Cold Hors d’Oeuvres Platter', desc: 'Jellyfish salad, roast pork belly, spiced beef shank, and pickled lotus root' },
    { num: '02', title: 'Honey Walnut Jumbo Prawns', desc: 'Crisp tempura prawns tossed in creamy honey glaze with candied walnuts' },
    { num: '03', title: 'Imperial Seafood & Fish Maw Soup', desc: 'Slow-simmered rich golden broth with fresh crab meat and scallops' },
    { num: '04', title: 'Crisp Skin Peking Roast Duck', desc: 'Served with warm steamed lotus buns, scallions, cucumbers, and plum hoisin' },
    { num: '05', title: 'Twin Lobster with Ginger & Scallions', desc: 'Wok-tossed live Maine lobster over fragrant garlic egg noodles' },
    { num: '06', title: 'Steamed Whole Chilean Sea Bass', desc: 'Gently steamed with ginger, scallions, and premium seasoned soy elixir' },
    { num: '07', title: 'Special House Lotus Leaf Fried Rice', desc: 'Diced Chinese sausage, dried shrimp, mushrooms, and fragrant jasmine rice' },
    { num: '08', title: 'Red Bean Sweet Soup & Warm Sesame Balls', desc: 'Traditional Chè Đậu Đỏ with lotus seeds symbolizing eternal sweetness & joy' },
  ];

  const banquetCoursesVi = [
    { num: '01', title: 'Khai Vị Tứ Quý Hoàng Gia', desc: 'Gỏi sứa tôm thịt, heo quay giòn bì, bắp bò hoa ngũ vị và ngó sen chua ngọt' },
    { num: '02', title: 'Tôm Chiên Sốt Quả Óc Chó Giòn Rụm', desc: 'Tôm sú chiên giòn quyện sốt mật ong béo ngậy kèm hạt óc chó caramen' },
    { num: '03', title: 'Súp Hải Vị Bong Bóng Cá Thượng Hạng', desc: 'Nước dùng thanh ngọt hầm chậm cùng thịt cua tươi, sò điệp và nấm đông cô' },
    { num: '04', title: 'Vịt Quay Bắc Kinh Da Giòn', desc: 'Ăn kèm bánh bao hấp nóng hổi, đầu hành hoa, dưa leo và sốt mận Hoisin' },
    { num: '05', title: 'Tôm Hùm Đôi Xào Gừng Hành Thượng Hạng', desc: 'Tôm hùm xào lửa lớn đẫm sốt gừng hành thơm lừng trên nền mì trứng tỏi' },
    { num: '06', title: 'Cá Chẽm / Cá Tuyết Hấp Hồng Kông', desc: 'Hấp nguyên con cùng gừng, hành lá và nước tương hảo hạng đậm đà' },
    { num: '07', title: 'Cơm Chiên Lá Sen Bát Bửu', desc: 'Lạp xưởng Mai Quế Lộ, tôm khô, nấm hương gói trong lá sen thơm ngát' },
    { num: '08', title: 'Chè Đậu Đỏ Hạt Sen & Bánh Cam Mè Ấm Áp', desc: 'Món tráng miệng truyền thống mang ý nghĩa bách niên giai lão và ngọt ngào' },
  ];

  const courses = lang === 'vi' ? banquetCoursesVi : banquetCoursesEn;

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Story Card: Imperial Vietnamese Celebration Frame */}
      <div className="relative bg-gradient-to-br from-white/95 via-rose-50/35 to-amber-50/40 backdrop-blur-md rounded-3xl p-7 sm:p-12 border border-gold-400/60 shadow-md mb-14 text-center max-w-4xl mx-auto">
        <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-7 h-7 text-gold-500/70" />
        <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-7 h-7 text-gold-500/70" />

        <div className="flex justify-center mb-3">
          <VietnameseLotusCrest className="w-9 h-9 text-crimson-700" />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-3">
          {t.story_heading}
        </h2>

        <div className="my-3">
          <VietnameseCloudDivider />
        </div>

        <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl mx-auto">
          {t.story_p1}
        </p>
        <p className="text-sm sm:text-base leading-relaxed font-semibold text-crimson-900 max-w-2xl mx-auto">
          {t.story_p2}
        </p>
      </div>

      {/* 3 Jewel-Toned Cultural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Pillar 1: Attire (Lotus Rose & Silk Crimson) */}
        <div className="lotus-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-lotus-500 via-rose-600 to-crimson-800 text-white flex items-center justify-center mb-4 shadow-sm border border-lotus-300/40">
              <Shirt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {t.dress_code_title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.dress_code_desc}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-lotus-200/60 flex items-center gap-2 text-xs font-bold text-lotus-800">
            <Sparkles className="w-3.5 h-3.5 text-lotus-600" />
            <span>{lang === 'en' ? 'Áo Dài & Western Glam' : 'Áo Dài & Dạ Tiệc Sang Trọng'}</span>
          </div>
        </div>

        {/* Pillar 2: Host-Supplied Bar (Gilded Amber & Cognac) */}
        <div className="amber-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-gold-700 text-white flex items-center justify-center mb-4 shadow-sm border border-amber-300/40">
              <Wine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {t.drinks_title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.drinks_desc}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center gap-2 text-xs font-bold text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>{lang === 'en' ? 'Hennessy XO & Chào Bàn Toasting' : 'Hennessy XO & Rượu Nâng Ly Chào Bàn'}</span>
          </div>
        </div>

        {/* Pillar 3: Music & DJ (Imperial Jade & Royal Indigo) */}
        <div className="jade-glow-card rounded-2xl p-6 transition-all hover:scale-[1.01] flex flex-col justify-between">
          <div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-jade-600 via-emerald-700 to-teal-900 text-white flex items-center justify-center mb-4 shadow-sm border border-jade-300/40">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {lang === 'en' ? 'Bilingual Program & DJ' : 'Chương Trình Song Ngữ & DJ'}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {lang === 'en'
                ? 'An interactive evening featuring bilingual MC hosting, live toasting ceremony, Vietnamese & English dance classics, and guest song requests!'
                : 'Dạ tiệc dẫn dắt bởi MC song ngữ chuyên nghiệp, nghi thức Chào Bàn truyền thống và sàn nhảy sôi động cùng các bản hit V-Pop & quốc tế!'}
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-jade-200/60 flex items-center gap-2 text-xs font-bold text-jade-800">
            <Users className="w-3.5 h-3.5 text-jade-600" />
            <span>{lang === 'en' ? 'Bilingual MC & Open Dance Floor' : 'MC Song Ngữ & Khiêu Vũ Tự Do'}</span>
          </div>
        </div>
      </div>

      {/* 8-Course Banquet Showcase: Imperial Banquet Scroll */}
      <div className="relative bg-gradient-to-br from-white/95 via-amber-50/40 to-rose-50/30 rounded-3xl p-6 sm:p-10 border-2 border-gold-400/80 shadow-lg">
        <VietnameseCornerFlourish position="top-left" className="absolute top-3 left-3 w-8 h-8 text-gold-600/70" />
        <VietnameseCornerFlourish position="top-right" className="absolute top-3 right-3 w-8 h-8 text-gold-600/70" />
        <VietnameseCornerFlourish position="bottom-left" className="absolute bottom-3 left-3 w-8 h-8 text-gold-600/70" />
        <VietnameseCornerFlourish position="bottom-right" className="absolute bottom-3 right-3 w-8 h-8 text-gold-600/70" />

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-gold-100 text-amber-950 text-xs font-bold uppercase tracking-wider mb-2 border border-gold-300">
            <Utensils className="w-3.5 h-3.5 text-crimson-700" />
            <span>{lang === 'en' ? 'Imperial 8-Course Banquet' : 'Đại Tiệc Yến Á Đông 8 Món'}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {t.banquet_title}
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm mt-2">
            {t.banquet_desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.num}
              className="bg-white/95 p-4 sm:p-4.5 rounded-2xl border border-gold-200/80 shadow-2xs flex items-start gap-3.5 hover:border-gold-400 hover:shadow-xs transition-all"
            >
              {/* Imperial Seal Triện Son Badge */}
              <span className="text-xs font-bold font-serif px-2.5 py-1 rounded-lg bg-gradient-to-br from-crimson-800 to-crimson-950 text-gold-200 border border-gold-400/60 shadow-2xs shrink-0 mt-0.5">
                {c.num}
              </span>
              <div>
                <h4 className="text-sm font-bold text-stone-900 font-serif">
                  {c.title}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-normal">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
