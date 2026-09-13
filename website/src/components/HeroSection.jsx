import React from 'react';
import styled from 'styled-components';
import { ArrowRight, BookOpen, Calendar, Users } from 'lucide-react';

const HeroWrap = styled.section`
  background-color: var(--primary);
  color: white;
  padding: 80px 20px;
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 24px;
  letter-spacing: -1px;
  
  @media (max-width: 768px) { font-size: 36px; }
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: var(--primary-light);
  max-width: 700px;
  line-height: 1.6;
  margin-bottom: 40px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: white;
  color: var(--text-main);
  padding: 30px;
  border-radius: 8px;
  text-align: left;
  border-top: 4px solid var(--primary);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
`;

const IconWrap = styled.div`
  color: var(--primary);
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 12px;
`;

const CardText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
`;

export default function HeroSection() {
  return (
    <HeroWrap>
      <Content>
        <Title>Student Activities & Organizational Life</Title>
        <Subtitle>
          Welcome to the official portal of the Office of Student Affairs and Services. 
          Discover campus events, engage with student organizations, and access resources tailored for student leaders.
        </Subtitle>

        <Grid>
          <InfoCard>
            <IconWrap><Calendar size={28} /></IconWrap>
            <CardTitle>Campus Events</CardTitle>
            <CardText>
              View the unified calendar of all approved institutional and organizational events. Never miss out on campus life.
            </CardText>
          </InfoCard>

          <InfoCard>
            <IconWrap><Users size={28} /></IconWrap>
            <CardTitle>Student Organizations</CardTitle>
            <CardText>
              Connect with officially recognized student organizations. Find communities that match your academic and personal interests.
            </CardText>
          </InfoCard>

          <InfoCard>
            <IconWrap><BookOpen size={28} /></IconWrap>
            <CardTitle>OSAS Resources</CardTitle>
            <CardText>
              Access important guidelines, compliance requirements, and tools necessary for organizational management.
            </CardText>
          </InfoCard>
        </Grid>
      </Content>
    </HeroWrap>
  );
}
