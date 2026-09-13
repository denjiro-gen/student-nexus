import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Link } from 'react-scroll';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import slide1Img from '../images/gradpitik.jpg';
import slide2Img from '../images/DSC_3272.JPG';
import slide3Img from '../images/2.png';

const slides = [
  {
    image: slide1Img,
    title: 'Empowering Students for Success',
    description: 'OSAS is committed to providing quality programs, leadership opportunities, guidance, and student support that promote academic success and holistic development.',
  },
  {
    image: slide2Img,
    title: 'Fostering Campus Community and Leadership',
    description: 'Join accredited student organizations, participate in community programs, and develop leadership skills that last a lifetime.',
  },
  {
    image: slide3Img,
    title: 'Supporting Your Academic Journey',
    description: 'From scholarships to counseling and mental wellness programs, OSAS is here to support you every step of the way.',
  },
];

const HeroCarousel = () => {
  return (
    <section id="home" className="relative w-full h-[92vh] min-h-[620px] mt-16 md:mt-[72px]">
      <Swiper
        modules={[Pagination, Autoplay, EffectFade]}
        effect="fade"
        pagination={{ clickable: true }}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        loop={true}
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            {({ isActive }) => (
              <div className="relative w-full h-full">
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center px-4">
                  <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="max-w-2xl"
                      >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-extrabold text-white mb-5 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
                          {slide.description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to="organizations" smooth={true} duration={400} offset={-72}>
                            <button className="btn-primary text-base px-8 py-3.5 bg-osas-primary hover:bg-osas-secondary shadow-lg shadow-osas-primary/30 rounded-xl text-white font-semibold transition-all duration-200">
                              Explore Organizations
                            </button>
                          </Link>
                          <Link to="about" smooth={true} duration={400} offset={-72}>
                            <button className="bg-white/10 border border-white/30 text-white hover:bg-white hover:text-osas-primary px-8 py-3.5 rounded-xl font-semibold text-base transition-colors duration-200 backdrop-blur-sm">
                              Learn More
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroCarousel;
